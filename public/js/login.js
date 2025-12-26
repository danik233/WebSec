// ===============================
// CSRF HELPER FUNCTION
// ===============================
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// ===============================
// LOGIN.JS
// ===============================
const loginBtn = document.getElementById("loginBtn");

async function handleLogin() {
    const emailInput = document.getElementById("emailInput");
    const passInput = document.getElementById("passInput");

    const email = emailInput.value.trim().toLowerCase();
    const password = passInput.value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") // ADD THIS LINE
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Login failed.");
            return;
        }

        sessionStorage.setItem("email", email);
        if (data.role) sessionStorage.setItem("role", data.role);

        alert(data.message || "Login successful.");

        if (data.redirect) {
            await syncLocalFavoritesToMongo(email);
            window.location.href = data.redirect;
        }

    } catch (error) {
        console.error("Login error:", error);
        alert("Server error. Please try again later.");
    }
}

loginBtn.addEventListener("click", handleLogin);

// Enter key support
["emailInput", "passInput"].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    });
});

document.getElementById("signupBtn").addEventListener("click", () => {
    window.location.href = "signup.html";
});

async function syncLocalFavoritesToMongo(email) {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (!favorites.length) return;

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") // ADD THIS LINE
            },
            body: JSON.stringify({ newFavArray: favorites })
        });

        const data = await res.json();
        if (res.ok) {
            console.log("✅ Synced local favorites to MongoDB after login");
        } else {
            console.error("❌ Failed to sync favorites:", data.error || data.message);
        }
    } catch (err) {
        console.error("❌ Error syncing favorites:", err);
    }
}

const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModal");
const editForm = document.getElementById("editForm");
const editStatus = document.getElementById("editStatus");

// Open modal on forgot password button click
forgotPasswordBtn.addEventListener("click", () => {
    editForm.reset();
    editStatus.textContent = "";
    editModal.style.display = "block";
});

// Close modal when clicking the X button
closeModalBtn.addEventListener("click", () => {
    editModal.style.display = "none";
});

// Close modal if user clicks outside modal content
window.addEventListener("click", (event) => {
    if (event.target === editModal) {
        editModal.style.display = "none";
    }
});

// Handle form submission for forgot password update
editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("modalEmail").value.trim().toLowerCase();
    const newPassword = document.getElementById("modalPassword").value;

    if (!email) {
        editStatus.textContent = "Email is required.";
        return;
    }
    if (!newPassword) {
        editStatus.textContent = "New password is required.";
        return;
    }

    editStatus.textContent = "Updating password...";

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") // ADD THIS LINE
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            editStatus.textContent = "✅ Password changed successfully. You can now login with your new password.";
            setTimeout(() => {
                editModal.style.display = "none";
            }, 2500);
        } else {
            editStatus.textContent = "❌ " + (data.message || "Failed to change password.");
        }
    } catch (err) {
        console.error("Forgot password modal error:", err);
        editStatus.textContent = "Server error. Please try again later.";
    }
});