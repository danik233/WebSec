require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const argon2 = require("argon2");
const nodemailer = require("nodemailer");
const User = require("./modules/user");

const app = express();
const PORT = process.env.PORT || 3000;


// Block access to JSON data files
app.use((req, res, next) => {
    if (req.url.endsWith(".json")) return res.status(403).send("Access Denied");
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// ===============================
// CONNECT TO MONGODB
// ===============================
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ===============================
// MAILER CONFIG
// ===============================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

async function sendSignupEmail(toEmail) {
    const mailOptions = {
        from: `"IsraTube" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Welcome to IsraTube!",
        html: `
            <h2>Welcome 🎉</h2>
            <p>Thanks for signing up to IsraTube.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${toEmail}`);
    } catch (err) {
        console.error("❌ Failed to send email:", err);
    }
}

// OPTIONAL: Sync db → JSON backup
async function syncUsersJson() {
    try {
        const users = await User.find().lean();
        fs.writeFileSync(
            path.join(__dirname, "data", "users.json"),
            JSON.stringify(users, null, 2),
            "utf8"
        );
        console.log("🔁 users.json synced");
    } catch (err) {
        console.error("❌ Failed to sync JSON:", err);
    }
}

// ===============================
// ROUTES (STATIC PAGES)
// ===============================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
});
app.get("/homepage.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "homepage.html"));
});


// ===============================
// FIRST-USER / ADMIN SETUP
// ===============================
app.post("/setup", async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0)
            return res.status(403).json({ message: "Setup already completed" });

        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const hashedPassword = await argon2.hash(password);

        const admin = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            paid: true,
            role: "ADMIN"
        });

        await admin.save();
        res.status(201).json({ message: "✅ Admin account created successfully" });

    } catch (err) {
        console.error("❌ Setup error:", err);
        res.status(500).json({ message: "Server error during admin setup" });
    }
});







// ===============================
// LOGIN
// ===============================
app.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        // Admin shortcut
        if (email === "admin@admin" && password === "admin")
            return res.json({
                role: "admin",
                message: "Admin login successful",
                redirect: "/admin.html"
            });

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found. Please signup." });

        const passwordMatch = await argon2.verify(user.password, password);
        if (!passwordMatch)
            return res.status(401).json({ message: "Incorrect password." });

        const message = user.paid
            ? "Login successful."
            : "Login successful. Free trial 30 days.";

        res.json({
            role: "user",
            message,
            redirect: "/homepage.html"
        });

    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// ===============================
// SIGNUP
// ===============================
app.post("/signup", async (req, res) => {
    try {
        let { email, password, repeatPassword, paid, favArray = [] } = req.body;
        if (email) email = email.toLowerCase();

        if (!email || !password || !repeatPassword || typeof paid !== "boolean")
            return res.status(400).json({ message: "All fields required" });

        if (password !== repeatPassword)
            return res.status(400).json({ message: "Passwords do not match" });

        if (favArray.length > 50)
            return res.status(400).json({ message: "Too many favorite movies" });

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(409).json({ message: "Email already exists." });

        const hashedPassword = await argon2.hash(password);

        const newUser = new User({ email, password: hashedPassword, paid, favArray });
        await newUser.save();
        await syncUsersJson();
        await sendSignupEmail(email);

        res.status(201).json({
            message: paid
                ? "Signup successful."
                : "Signup successful. Free trial 30 days."
        });

    } catch (err) {
        console.error("❌ Signup error:", err);
        res.status(500).json({ message: "Server error during signup" });
    }
});

// ===============================
// GET ALL USERS (ADMIN)
// ===============================
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().lean();
        await syncUsersJson();
        res.json(users);
    } catch (err) {
        console.error("❌ Get users error:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ===============================
// UPDATE USER
// ===============================
app.put("/api/users/:email", async (req, res) => {
    try {
        const userEmail = decodeURIComponent(req.params.email).toLowerCase();
        const { newEmail, newPassword, newPaid, newFavArray } = req.body;

        const user = await User.findOne({ email: userEmail });
        if (!user)
            return res.status(404).json({ error: "User not found" });

        // Change email
        if (newEmail && newEmail !== user.email) {
            const exists = await User.findOne({ email: newEmail });
            if (exists)
                return res.status(409).json({ error: "Email already in use" });

            user.email = newEmail.toLowerCase();
        }

        // Change password
        if (newPassword)
            user.password = await argon2.hash(newPassword);

        if (typeof newPaid === "boolean")
            user.paid = newPaid;

        if (Array.isArray(newFavArray)) {
            if (newFavArray.length > 50)
                return res.status(400).json({ error: "Too many favorite movies" });
            user.favArray = newFavArray;
        }

        await user.save();
        await syncUsersJson();

        res.json({ message: `User ${userEmail} updated.` });

    } catch (err) {
        console.error("❌ Update user error:", err);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// ===============================
// DELETE USER
// ===============================
app.delete("/api/users/:email", async (req, res) => {
    try {
        const userEmail = decodeURIComponent(req.params.email).toLowerCase();
        const removed = await User.findOneAndDelete({ email: userEmail });

        if (!removed)
            return res.status(404).json({ error: "User not found" });

        await syncUsersJson();
        res.json({ message: `User ${userEmail} deleted.` });

    } catch (err) {
        console.error("❌ Delete error:", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
