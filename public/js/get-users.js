// ===============================
// get-users.js - FOR ADMIN PAGE ONLY
// ===============================

// CSRF HELPER FUNCTION
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Helper to format date or show "N/A"
function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
}

document.addEventListener("DOMContentLoaded", async () => {
    // CHECK IF WE'RE ON THE ADMIN PAGE
    const table = document.querySelector("table");
    if (!table) {
        console.log("Not on admin page, skipping user load");
        return;
    }

    try {
        const res = await fetch("/api/users", {
            headers: {
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || ""
            }
        });
        if (!res.ok) throw new Error("Failed to fetch users");

        const users = await res.json();

        // Clear all previous rows except header
        document.querySelectorAll("tr:not(:first-child)").forEach(r => r.remove());

        users.forEach(user => {
            const row = document.createElement("tr");

            // Generate favorite movies thumbnails
            let favHtml = "None";
            if (Array.isArray(user.favArray) && user.favArray.length > 0) {
                favHtml = "<div style='display: flex; flex-wrap: wrap; gap: 8px;'>";
                favHtml += user.favArray.map(fav => {
                    const title = fav.Title || "Untitled";
                    const imdbID = fav.imdbID || "#";
                    const poster = fav.Poster && fav.Poster !== "N/A" ? fav.Poster : "images/error-img.png";

                    return `
                        <a href="movieIMDB.html?imdbID=${imdbID}&admin=true" title="${title}">
                            <img 
                                src="${poster}" 
                                alt="${title}" 
                                style="width: 60px; height: 90px; object-fit: cover; border-radius: 4px; box-shadow: 0 0 4px rgba(0,0,0,0.3);" 
                                onerror="this.src='images/error-img.png';"
                            />
                        </a>
                    `;
                }).join("");
                favHtml += "</div>";
            }

            // Format signup date
            const signedDate = formatDate(user.signupDate);

            // Calculate trial END date if user is not paid
            let endDate = "N/A";
            if (user.signupDate && user.paid === false) {
                const signup = new Date(user.signupDate);
                const trialEnd = new Date(signup.getTime() + 30 * 24 * 60 * 60 * 1000);
                endDate = formatDate(trialEnd);
            }

            row.innerHTML = `
                <td>${user.email}</td>
                <td>${user.paid ? "✅" : "❌"}</td>
                <td>${favHtml}</td>
                <td>${signedDate}</td>
                <td>${endDate}</td>
                <td>
                    <button onclick="deleteUser('${user.email}')">🗑️</button>
                    <button onclick="changeUser('${user.email}')">✏️</button>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (err) {
        console.error("❌ Failed to load users:", err);
        alert("Failed to load users.");
    }
});

async function deleteUser(email) {
    if (!confirm(`Delete ${email}?`)) return;

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: "DELETE",
            headers: {
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN")
            }
        });
        const data = await res.json();
        alert(data.message);
        location.reload();
    } catch (err) {
        console.error("❌ Delete error:", err);
        alert("Failed to delete user.");
    }
}

let currentEditingEmail = null;

function changeUser(email) {
    currentEditingEmail = email;
    const modalEmail = document.getElementById("modalEmail");
    const modalPassword = document.getElementById("modalPassword");
    const editModal = document.getElementById("editModal");
    
    if (modalEmail) modalEmail.value = email;
    if (modalPassword) modalPassword.value = "";
    if (editModal) editModal.style.display = "block";
}

// Safe event listeners - only add if elements exist
const closeModal = document.getElementById("closeModal");
if (closeModal) {
    closeModal.onclick = () => {
        const editModal = document.getElementById("editModal");
        const editStatus = document.getElementById("editStatus");
        if (editModal) editModal.style.display = "none";
        if (editStatus) editStatus.textContent = "";
    };
}

const editForm = document.getElementById("editForm");
if (editForm) {
    editForm.onsubmit = async (e) => {
        e.preventDefault();

        const newEmail = document.getElementById("modalEmail").value.trim();
        const newPassword = document.getElementById("modalPassword").value.trim();
        const editStatus = document.getElementById("editStatus");

        if (!newPassword) {
            if (editStatus) editStatus.textContent = "❌ Password is required to update email.";
            return;
        }

        const updatePayload = { newEmail, newPassword };

        try {
            const res = await fetch(`/api/users/${encodeURIComponent(currentEditingEmail)}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": getCookie("XSRF-TOKEN")
                },
                body: JSON.stringify(updatePayload)
            });

            const data = await res.json();

            if (!res.ok) {
                if (editStatus) editStatus.textContent = "❌ " + (data.error || data.message);
                return;
            }

            if (editStatus) editStatus.textContent = "✅ " + data.message;
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            console.error("❌ Update error:", err);
            if (editStatus) editStatus.textContent = "Failed to update user.";
        }
    };
}

window.onclick = (event) => {
    const modal = document.getElementById("editModal");
    if (modal && event.target === modal) {
        modal.style.display = "none";
        const editStatus = document.getElementById("editStatus");
        if (editStatus) editStatus.textContent = "";
    }
};