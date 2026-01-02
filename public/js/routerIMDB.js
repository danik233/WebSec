// ===============================
// routerIMDB.js - FOR PAGES WITH FAVORITES
// ===============================

// CSRF HELPER FUNCTION
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

async function syncFavoritesToMongo() {
    const email = sessionStorage.getItem('email');
    
    // Skip sync for hardcoded admin or no user
    if (!email || email === 'admin@admin') {
        console.warn("Skipping sync for admin or no user logged in.");
        return;
    }

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
            },
            body: JSON.stringify({ newFavArray: favorites })
        });

        const data = await res.json();
        if (res.ok) {
            console.log("✅ Favorites synced to MongoDB:", data.message);
        } else {
            console.error("❌ Failed to sync favorites:", data.error || data.message);
        }
    } catch (err) {
        console.error("❌ Error syncing favorites:", err);
    }
}

window.addEventListener('beforeunload', () => {
    syncFavoritesToMongo();
});