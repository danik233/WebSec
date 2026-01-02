// syncFavorites.js

// Add CSRF helper
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

(async function syncFavoritesImmediately() {
    const email = sessionStorage.getItem("email");
    const localFavs = JSON.parse(localStorage.getItem("favorites") || "[]");

    // Skip sync for hardcoded admin or no user
    if (!email || email === "admin@admin" || !localFavs.length) {
        return;
    }

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCookie("XSRF-TOKEN")
            },
            body: JSON.stringify({ newFavArray: localFavs })
        });

        const data = await res.json();

        if (res.ok) {
            console.log("✅ Synced favorites immediately on page load.");
        } else {
            console.error("❌ Failed to sync favorites:", data.error || data.message);
        }
    } catch (err) {
        console.error("❌ Error syncing favorites:", err);
    }
})();