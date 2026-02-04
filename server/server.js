// ===============================
// ENVIRONMENT & DEPENDENCIES
// ===============================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const argon2 = require("argon2");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');
const User = require("./modules/user");
const uploadRoutes = require("./routes/upload.routes");

// ===============================
// SECURITY & APP CONSTANTS
// ===============================
const CONSTANTS = Object.freeze({
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Password Validation
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_UPPERCASE_REGEX: /[A-Z]/,
  PASSWORD_LOWERCASE_REGEX: /[a-z]/,
  PASSWORD_NUMBER_REGEX: /\d/,
  PASSWORD_SPECIAL_REGEX: /[!@#$%^&*]/,
  PASSWORD_SPECIAL_CHARS: "!@#$%^&*",
  
  // CSRF Protection
  CSRF_TOKEN_COOKIE_NAME: "XSRF-TOKEN",
  CSRF_TOKEN_HEADER_NAME: "x-xsrf-token",
  CSRF_TOKEN_BYTES: 32,
  CSRF_COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  
  // Account Security
  MAX_FAILED_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 10 * 60 * 1000, // 10 minutes
  
  // File Upload
  MAX_FAVORITE_MOVIES: 50,
  
  // API Paths
  UPLOAD_DIR_NAME: "uploads",
  DATA_DIR_NAME: "data",
  USERS_JSON_FILE: "users.json",
  
  // File Types
  JSON_FILE_EXTENSION: ".json",
  
  // HTTP Methods
  SAFE_METHODS: ["GET", "HEAD", "OPTIONS"],
  
  // Email
  EMAIL_SERVICE: "gmail",
  
  // Swagger
  SWAGGER_EXPLORER: true,
  SWAGGER_SITE_TITLE: "IsraTube API Docs",
  SWAGGER_DOC_PATH: "/api-docs",
  
  // Database
  MONGODB_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  
  // User Roles
  ROLE_ADMIN: "ADMIN",
  ROLE_USER: "user",
  
  // Trial Duration
  FREE_TRIAL_DAYS: 30,
});

Object.freeze(CONSTANTS);

// ===============================
// APP INITIALIZATION
// ===============================
const app = express();

// ===============================
// PASSWORD VALIDATION BLOCK
// ===============================
{
  /**
   * Validates password strength against security requirements
   * @param {string} password - Password to validate
   * @throws {string} - Error message if validation fails
   * @returns {void}
   */
  const validatePassword = (password) => {
    if (password.length < CONSTANTS.PASSWORD_MIN_LENGTH) {
      throw `Password too short (minimum ${CONSTANTS.PASSWORD_MIN_LENGTH} characters)`;
    }
    if (!CONSTANTS.PASSWORD_UPPERCASE_REGEX.test(password)) {
      throw "Password must have an uppercase letter";
    }
    if (!CONSTANTS.PASSWORD_LOWERCASE_REGEX.test(password)) {
      throw "Password must have a lowercase letter";
    }
    if (!CONSTANTS.PASSWORD_NUMBER_REGEX.test(password)) {
      throw "Password must have a number";
    }
    if (!CONSTANTS.PASSWORD_SPECIAL_REGEX.test(password)) {
      throw `Password must have a special character (${CONSTANTS.PASSWORD_SPECIAL_CHARS})`;
    }
  };

  // Expose through module context
  app.locals.validatePassword = validatePassword;
}

// ===============================
// CSRF PROTECTION BLOCK
// ===============================
{
  /**
   * Generates a cryptographically secure CSRF token
   * @returns {string} - Hex-encoded CSRF token
   */
  const generateCSRFToken = () => {
    return crypto.randomBytes(CONSTANTS.CSRF_TOKEN_BYTES).toString("hex");
  };

  /**
   * Middleware to set CSRF token for GET/HEAD/OPTIONS requests
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {void}
   */
  const csrfTokenMiddleware = (req, res, next) => {
    if (CONSTANTS.SAFE_METHODS.includes(req.method)) {
      const existingToken = req.cookies[CONSTANTS.CSRF_TOKEN_COOKIE_NAME];
      if (!existingToken) {
        const token = generateCSRFToken();
        res.cookie(CONSTANTS.CSRF_TOKEN_COOKIE_NAME, token, {
          httpOnly: false,
          secure: CONSTANTS.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: CONSTANTS.CSRF_COOKIE_MAX_AGE,
        });
      }
    }
    next();
  };

  /**
   * Middleware to validate CSRF token on state-changing requests
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {void}
   */
  const validateCSRFToken = (req, res, next) => {
    if (CONSTANTS.SAFE_METHODS.includes(req.method)) {
      return next();
    }

    const cookieToken = req.cookies[CONSTANTS.CSRF_TOKEN_COOKIE_NAME];
    const headerToken = req.headers[CONSTANTS.CSRF_TOKEN_HEADER_NAME];

    if (!cookieToken || !headerToken) {
      console.log(
        `❌ CSRF token missing - Cookie: ${!!cookieToken}, Header: ${!!headerToken}`
      );
      return res.status(403).json({ message: "CSRF token missing" });
    }

    if (cookieToken !== headerToken) {
      console.log("❌ CSRF token mismatch");
      return res.status(403).json({ message: "CSRF token mismatch" });
    }

    next();
  };

  // Expose through app.locals
  app.locals.csrfTokenMiddleware = csrfTokenMiddleware;
  app.locals.validateCSRFToken = validateCSRFToken;
}

// ===============================
// MIDDLEWARE SETUP
// ===============================
{
  // Block access to JSON files
  app.use((req, res, next) => {
    if (req.url.endsWith(CONSTANTS.JSON_FILE_EXTENSION)) {
      return res.status(403).send("Access Denied");
    }
    next();
  });

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());
  app.use(app.locals.csrfTokenMiddleware);
  app.use(express.static(path.join(__dirname, "..", "public")));
}

// ===============================
// SWAGGER CONFIGURATION BLOCK
// ===============================
{
  if (CONSTANTS.NODE_ENV !== "production") {
    app.use(
      CONSTANTS.SWAGGER_DOC_PATH,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: CONSTANTS.SWAGGER_EXPLORER,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: CONSTANTS.SWAGGER_SITE_TITLE,
      })
    );
    console.log(`📚 Swagger UI available at http://localhost:${CONSTANTS.PORT}${CONSTANTS.SWAGGER_DOC_PATH}`);
  } else {
    app.use(CONSTANTS.SWAGGER_DOC_PATH, (req, res) => {
      res.status(404).send("Not Found");
    });
  }
}

// ===============================
// FILE UPLOAD DIRECTORY SETUP BLOCK
// ===============================
{
  const uploadsDir = path.join(__dirname, CONSTANTS.UPLOAD_DIR_NAME);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
    console.log("📁 Created uploads directory");
  }

  const dataDir = path.join(__dirname, CONSTANTS.DATA_DIR_NAME);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
    console.log("📁 Created data directory");
  }
}

// ===============================
// FILE UPLOAD ROUTES
// ===============================
{
  app.use("/api/upload", app.locals.validateCSRFToken, uploadRoutes);
}

// ===============================
// DATABASE CONNECTION BLOCK
// ===============================
{
  mongoose
    .connect(process.env.MONGO_URI, CONSTANTS.MONGODB_OPTIONS)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// ===============================
// MAILER CONFIGURATION BLOCK
// ===============================
{
  const transporter = nodemailer.createTransport({
    service: CONSTANTS.EMAIL_SERVICE,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  /**
   * Sends a welcome email to new user
   * @async
   * @param {string} toEmail - Recipient email address
   * @returns {Promise<void>}
   */
  const sendSignupEmail = async (toEmail) => {
    const mailOptions = {
      from: `"IsraTube" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Welcome to IsraTube!",
      html: `<h2>Welcome 🎉</h2><p>Thanks for signing up to IsraTube.</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${toEmail}`);
    } catch (err) {
      console.error("❌ Failed to send email:", err);
    }
  };

  app.locals.sendSignupEmail = sendSignupEmail;
}

// ===============================
// DATABASE SYNC BLOCK
// ===============================
{
  /**
   * Syncs user data from MongoDB to users.json file
   * @async
   * @returns {Promise<void>}
   */
  const syncUsersJson = async () => {
    try {
      const users = await User.find().lean();
      const filePath = path.join(
        __dirname,
        CONSTANTS.DATA_DIR_NAME,
        CONSTANTS.USERS_JSON_FILE
      );
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
      console.log("🔁 users.json synced");
    } catch (err) {
      console.error("❌ Failed to sync JSON:", err);
    }
  };

  app.locals.syncUsersJson = syncUsersJson;
}

// ===============================
// STATIC ROUTES BLOCK
// ===============================
{
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });

  app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "admin.html"));
  });

  app.get("/homepage.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "homepage.html"));
  });
}

// ===============================
// AUTHENTICATION ROUTES BLOCK
// ===============================
{
  /**
   * POST /setup
   * Creates the first admin account (only if no users exist)
   * @swagger
   * /setup:
   *   post:
   *     tags: [Authentication]
   *     summary: Create the first admin account
   *     description: Only works if no users exist in the database
   *     security:
   *       - csrfToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: admin@isratube.com
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *                 example: AdminPass123!
   *     responses:
   *       201:
   *         description: Admin account created successfully
   *       400:
   *         description: Validation error
   *       403:
   *         description: Setup already completed or CSRF error
   *       500:
   *         description: Server error
   */
  app.post("/setup", app.locals.validateCSRFToken, async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        return res.status(403).json({ message: "Setup already completed" });
      }

      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      try {
        app.locals.validatePassword(password);
      } catch (err) {
        return res.status(400).json({ message: err });
      }

      const hashedPassword = await argon2.hash(password);
      const admin = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        paid: true,
        role: CONSTANTS.ROLE_ADMIN,
      });

      await admin.save();
      res.status(201).json({ message: "✅ Admin account created successfully" });
    } catch (err) {
      console.error("❌ Setup error:", err);
      res.status(500).json({ message: "Server error during admin setup" });
    }
  });

  /**
   * POST /login
   * Authenticates user and returns role-based redirect
   * @swagger
   * /login:
   *   post:
   *     tags: [Authentication]
   *     summary: User login
   *     description: Authenticate user and get role-based redirect
   *     security:
   *       - csrfToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Login successful
   *       400:
   *         description: Missing credentials
   *       401:
   *         description: Incorrect password
   *       403:
   *         description: Account locked
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  app.post("/login", app.locals.validateCSRFToken, async (req, res) => {
    try {
      let { email, password } = req.body;
      if (email) email = email.toLowerCase();

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Hardcoded admin login
      if (
        email === process.env.USER_ADMIN &&
        password === process.env.PASSWORD_ADMIN
      ) {
        return res.json({
          role: "admin",
          message: "Admin login successful",
          redirect: "/admin.html",
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found. Please signup." });
      }

      if (user.lockUntil && user.lockUntil > Date.now()) {
        return res.status(403).json({ message: "Account locked. Try later." });
      }

      const passwordMatch = await argon2.verify(user.password, password);

      if (!passwordMatch) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;

        if (user.failedAttempts >= CONSTANTS.MAX_FAILED_ATTEMPTS) {
          user.lockUntil = Date.now() + CONSTANTS.ACCOUNT_LOCK_DURATION;
          await user.save();
          return res.status(403).json({
            message: "Account locked due to too many failed attempts. Try in 10 minutes.",
          });
        }

        await user.save();
        return res.status(401).json({ message: "Incorrect password." });
      }

      user.failedAttempts = 0;
      user.lockUntil = null;
      await user.save();

      const message = user.paid
        ? "Login successful."
        : `Login successful. Free trial ${CONSTANTS.FREE_TRIAL_DAYS} days.`;

      res.json({ role: CONSTANTS.ROLE_USER, message, redirect: "/homepage.html" });
    } catch (err) {
      console.error("❌ Login error:", err);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  /**
   * POST /signup
   * Creates a new user account
   * @swagger
   * /signup:
   *   post:
   *     tags: [Authentication]
   *     summary: Create a new user account
   *     security:
   *       - csrfToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - repeatPassword
   *               - paid
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 format: password
   *               repeatPassword:
   *                 type: string
   *                 format: password
   *               paid:
   *                 type: boolean
   *               favArray:
   *                 type: array
   *                 items:
   *                   type: string
   *                 maxItems: 50
   *     responses:
   *       201:
   *         description: Signup successful
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Server error
   */
  app.post("/signup", app.locals.validateCSRFToken, async (req, res) => {
    try {
      let { email, password, repeatPassword, paid, favArray = [] } = req.body;
      if (email) email = email.toLowerCase();

      if (!email || !password || !repeatPassword || typeof paid !== "boolean") {
        return res.status(400).json({ message: "All fields required" });
      }

      if (password !== repeatPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      try {
        app.locals.validatePassword(password);
      } catch (err) {
        return res.status(400).json({ message: err });
      }

      if (favArray.length > CONSTANTS.MAX_FAVORITE_MOVIES) {
        return res.status(400).json({ message: "Too many favorite movies" });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: "Email already exists." });
      }

      const hashedPassword = await argon2.hash(password);
      const newUser = new User({
        email,
        password: hashedPassword,
        paid,
        favArray,
      });

      await newUser.save();
      await app.locals.syncUsersJson();
      await app.locals.sendSignupEmail(email);

      const message = paid
        ? "Signup successful."
        : `Signup successful. Free trial ${CONSTANTS.FREE_TRIAL_DAYS} days.`;

      res.status(201).json({ message });
    } catch (err) {
      console.error("❌ Signup error:", err);
      res.status(500).json({ message: "Server error during signup" });
    }
  });
}

// ===============================
// USER MANAGEMENT ROUTES BLOCK
// ===============================
{
  /**
   * GET /api/users
   * Retrieves all users (Admin only)
   * @swagger
   * /api/users:
   *   get:
   *     tags: [Users]
   *     summary: Get all users
   *     description: Retrieve list of all users in the system
   *     responses:
   *       200:
   *         description: List of users
   *       500:
   *         description: Server error
   */
  app.get("/api/users", async (req, res) => {
    console.log("📋 GET /api/users called");
    try {
      const users = await User.find().lean();
      await app.locals.syncUsersJson();
      res.json(users);
    } catch (err) {
      console.error("❌ Get users error:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  /**
   * PUT /api/users/:email
   * Updates user information (Admin only)
   * @swagger
   * /api/users/{email}:
   *   put:
   *     tags: [Users]
   *     summary: Update user information
   *     security:
   *       - csrfToken: []
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               newEmail:
   *                 type: string
   *                 format: email
   *               newPassword:
   *                 type: string
   *                 format: password
   *               newPaid:
   *                 type: boolean
   *               newFavArray:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: User updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: User not found
   *       409:
   *         description: Email already in use
   *       500:
   *         description: Server error
   */
  app.put("/api/users/:email", app.locals.validateCSRFToken, async (req, res) => {
    try {
      const userEmail = decodeURIComponent(req.params.email).toLowerCase();
      const { newEmail, newPassword, newPaid, newFavArray } = req.body;

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (newEmail && newEmail !== user.email) {
        const exists = await User.findOne({ email: newEmail });
        if (exists) return res.status(409).json({ error: "Email already in use" });
        user.email = newEmail.toLowerCase();
      }

      if (newPassword) {
        try {
          app.locals.validatePassword(newPassword);
        } catch (err) {
          return res.status(400).json({ error: err });
        }
        user.password = await argon2.hash(newPassword);
      }

      if (typeof newPaid === "boolean") user.paid = newPaid;

      if (Array.isArray(newFavArray)) {
        if (newFavArray.length > CONSTANTS.MAX_FAVORITE_MOVIES) {
          return res.status(400).json({ error: "Too many favorite movies" });
        }
        user.favArray = newFavArray;
      }

      await user.save();
      await app.locals.syncUsersJson();
      res.json({ message: `User ${userEmail} updated.` });
    } catch (err) {
      console.error("❌ Update user error:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  /**
   * DELETE /api/users/:email
   * Deletes a user (Admin only)
   * @swagger
   * /api/users/{email}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete user
   *     security:
   *       - csrfToken: []
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  app.delete("/api/users/:email", app.locals.validateCSRFToken, async (req, res) => {
    try {
      const userEmail = decodeURIComponent(req.params.email).toLowerCase();
      const removed = await User.findOneAndDelete({ email: userEmail });

      if (!removed) {
        return res.status(404).json({ error: "User not found" });
      }

      await app.locals.syncUsersJson();
      res.json({ message: `User ${userEmail} deleted.` });
    } catch (err) {
      console.error("❌ Delete error:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}

// ===============================
// SERVER STARTUP BLOCK
// ===============================
{
  app.listen(CONSTANTS.PORT, () => {
    console.log(`🚀 Server running at http://localhost:${CONSTANTS.PORT}`);
  });
}