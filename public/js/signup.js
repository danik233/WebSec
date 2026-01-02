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
// SIGNUP.JS
// ===============================
const signupBtn = document.getElementById("signupBtn");
const paidBtn = document.querySelector(".paid-btn");
const notPaidBtn = document.querySelector(".not-paid-btn");

let paidStatus = null;

function updateSignupBtnState() {
    if (paidStatus !== null) {
        signupBtn.disabled = false;
        signupBtn.classList.add("enabled");
    } else {
        signupBtn.disabled = true;
        signupBtn.classList.remove("enabled");
    }
}

paidBtn.addEventListener("click", () => {
    paidStatus = true;
    paidBtn.classList.add("selected");
    notPaidBtn.classList.remove("selected");
    updateSignupBtnState();
});

notPaidBtn.addEventListener("click", () => {
    paidStatus = false;
    notPaidBtn.classList.add("selected");
    paidBtn.classList.remove("selected");
    updateSignupBtnState();
});

function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

async function handleSignup() {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passInput").value;
    const repeatPassword = document.getElementById("repeatPassInput").value;

    if (!email || !password || !repeatPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (paidStatus === null) {
        alert("Please select Paid or Not Paid.");
        return;
    }

    try {
        const res = await fetch("/signup", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN")
            },
            body: JSON.stringify({ email, password, repeatPassword, paid: paidStatus, favArray: [] }),
        });

        const data = await res.json();

        if (res.ok) {
            alert("Signup successful!");
            window.location.href = "index.html";
        } else {
            alert(data.message || "Signup failed.");
        }
    } catch (err) {
        console.error("❌ Signup error:", err);
        alert("Server error. Please try again later.");
    }
}

signupBtn.addEventListener("click", handleSignup);

["emailInput", "passInput", "repeatPassInput"].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleSignup();
        }
    });
});

const gotoLogin = document.getElementById("gotoLogin");
gotoLogin.addEventListener("click", () => {
    window.location.href = "index.html";
});

updateSignupBtnState();