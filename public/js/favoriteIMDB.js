const favContainer = document.getElementById('favoritesList');
let favorites = [];

// ADD CSRF HELPER FUNCTION
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

window.addEventListener('load', () => {
  applyDarkMode();

  const stored = localStorage.getItem('favorites');
  if (stored) {
    favorites = JSON.parse(stored);
  }
  renderFavorites();
});

function applyDarkMode() {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  document.body.style.backgroundColor = isDarkMode ? "black" : "white";

  const h1 = document.getElementsByTagName("h1")[0];
  if (h1) h1.style.color = isDarkMode ? "white" : "black";

  if (favContainer) {
    favContainer.style.backgroundColor = isDarkMode ? "#000000" : "#ffffff";
    favContainer.style.color = isDarkMode ? "white" : "black";
  }
}

function renderFavorites() {
  favContainer.innerHTML = '';
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  if (favorites.length === 0) {
    favContainer.innerHTML = `<p style="color: ${isDarkMode ? 'white' : 'black'}">No favorites yet.</p>`;
    return;
  }

  favorites.forEach(m => {
    const div = document.createElement('div');
    div.className = 'favorite-movie';
    div.style.backgroundColor = isDarkMode ? '#333333' : '#999999';
    div.style.color = isDarkMode ? 'white' : 'black';

    div.innerHTML = `
      <a href="movieIMDB.html?imdbID=${m.imdbID}">
        <img
          src="${m.Poster !== 'N/A' ? m.Poster : 'images/error-img.png'}"
          alt="${m.Title}"
          onerror="this.onerror=null;this.src='images/error-img.png';"
        />
      </a>
      <div class="movie-details">
        <h2>${m.Title}</h2>
        <br>
        <button data-id="${m.imdbID}" class="remove-btn">Remove</button>
      </div>
    `;

    const movieDetails = div.querySelector('.movie-details');
    movieDetails.style.color = isDarkMode ? 'white' : 'black';

    div.querySelector('.remove-btn')
      .addEventListener('click', () => removeFavorite(m.imdbID));

    favContainer.appendChild(div);
  });
}

function removeFavorite(id) {
  favorites = favorites.filter(m => m.imdbID !== id);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  renderFavorites();
  syncFavoritesToMongo();
}

// ADD CSRF TOKEN HERE
async function syncFavoritesToMongo() {
  const email = sessionStorage.getItem("email");
  if (!email) return;

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") // ADD THIS LINE
      },
      body: JSON.stringify({ newFavArray: favorites })
    });

    if (res.ok) {
      console.log("✅ Synced favorites to MongoDB.");
    } else {
      const data = await res.json();
      console.error("❌ Failed to sync favorites:", data.error || data.message);
    }
  } catch (err) {
    console.error("❌ Error syncing favorites:", err);
  }
}