let userPlaylists = JSON.parse(localStorage.getItem("zetaPlaylists")) || {};

const playlistListEl = document.getElementById("playlistList");
const addPlaylistBtn = document.getElementById("addPlaylistBtn");
const newPlaylistInput = document.getElementById("newPlaylistInput");

// Save to localStorage
function savePlaylists() {
  localStorage.setItem("zetaPlaylists", JSON.stringify(userPlaylists));
}

// Create playlist
addPlaylistBtn.addEventListener("click", () => {
  const name = newPlaylistInput.value.trim();
  if (!name) return alert("Please enter a playlist name.");
  if (userPlaylists[name]) return alert("Playlist already exists!");

  userPlaylists[name] = [];
  savePlaylists();
  newPlaylistInput.value = "";
  updatePlaylistUI();
});

function updatePlaylistUI() {
  playlistListEl.innerHTML = "";
  for (const name in userPlaylists) {
    const li = document.createElement("li");
    li.textContent = name;
    li.style.cursor = "pointer";

    // Click to view playlist
    li.addEventListener("click", () => {
      showPlaylist(name);
    });

    // Right-click to delete
    li.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Delete playlist "${name}"?`)) {
        delete userPlaylists[name];
        savePlaylists();
        updatePlaylistUI();
        // Clear the playlist display
        document.querySelector(".recommended").innerHTML = "";
      }
    });

    playlistListEl.appendChild(li);
  }
}

function showPlaylist(name) {
  const playlistSongs = userPlaylists[name];
  const container = document.querySelector(".recommended");
  container.innerHTML = ""; // Clear existing Recommended panel

  // Back button
  const backBtn = document.createElement("button");
  backBtn.textContent = "← Back to Recommended";
  backBtn.style.marginBottom = "10px";
  backBtn.onclick = () => location.reload(); // or you can rebuild recommended section manually
  container.appendChild(backBtn);

  // Playlist title
  const heading = document.createElement("h3");
  heading.textContent = `📁 ${name}`;
  container.appendChild(heading);

  const ul = document.createElement("ul");

  playlistSongs.forEach(song => {
    const li = document.createElement("li");
    li.textContent = song.title;
    li.classList.add("recommended-song");

    li.addEventListener("click", () => {
      const audio = document.getElementById("audio");
      document.querySelector(".title").textContent = song.title;
      document.querySelector(".cover").src = song.cover || "default.jpg";
      audio.src = song.src;
      audio.play();
      document.getElementById("playPauseBtn").textContent = "⏸️";
      document.getElementById("trivia-content").textContent = song.trivia || "";
    });

    // Right-click to remove from playlist
    li.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm(`Remove "${song.title}" from "${name}"?`)) {
        const index = userPlaylists[name].indexOf(song);
        if (index > -1) {
          userPlaylists[name].splice(index, 1);
          savePlaylists();
          showPlaylist(name);
        }
      }
    });

    ul.appendChild(li);
  });

  container.appendChild(ul);
}

 const triviaTrigger = document.querySelector('.trivia-trigger');
    const triviaPopup = document.querySelector('.trivia-popup');

    triviaTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      triviaPopup.style.display = 'block';
    });

    document.addEventListener('click', () => {
      triviaPopup.style.display = 'none';
    });

    triviaPopup.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent closing when clicking inside popup
    });
// Hook up Add to Playlist buttons
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".recommended-song").forEach((item) => {
    const title = item.childNodes[0].textContent.trim();
    const songObj = {
      title: title,
      src: "hotel.mp3",  // TODO: Replace with actual song source
      cover: "Hotelcalifornia.jpg",
      trivia: "Fun fact about " + title
    };

    const addToPlaylistBtn = item.querySelectorAll("button")[1];
    addToPlaylistBtn.addEventListener("click", () => {
      const keys = Object.keys(userPlaylists);
      if (!keys.length) return alert("Create a playlist first!");
      const selected = prompt("Add to which playlist?\n" + keys.join("\n"));
      if (selected && userPlaylists[selected]) {
        const alreadyIn = userPlaylists[selected].some(s => s.title === songObj.title);
        if (!alreadyIn) {
          userPlaylists[selected].push(songObj);
          savePlaylists();
          alert(`Added to ${selected}`);
        } else {
          alert("Already in playlist");
        }
      }
    });
  });

  // Show playlists on load
  updatePlaylistUI();
});

