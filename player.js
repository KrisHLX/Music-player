const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const progress = document.getElementById("progress");
const triviaContent = document.getElementById("trivia-content");
const queueList = document.getElementById("queueList");
const recommendedList = document.querySelector(".recommended ul");
const searchInput = document.querySelector(".search");

let savedPlaylists = JSON.parse(localStorage.getItem("zetaPlaylists")) || {};

let playlist = [];
let currentTrack = 0;

// NEW: store the actual currently playing song object (works for playlist or direct play)
let currentSongObj = null;

const allSongs = [
  {
    title: "Hotel California",
    artist: "The Eagles",
    src: "hotel.mp3",
    trivia: "Released in 1976 by The Eagles.",
    cover: "Hotelcalifornia.jpg",
    album: "Hotel California"
  },
  {
    title: "Blue",
    artist: "Yung Kai",
    src: "yung kai - blue (Lyrics).mp3",
    trivia: "OK.",
    cover: "Blue.png"
  },
  {
    title: "Die for you",
    artist: "Valorant",
    src: "Die For You ft. Grabbitz  Official Music Video  VALORANT Champions 2021.mp3",
    trivia: "2021.",
    cover: "valo.jpg"
  },
  {
    title: "Sunflower",
    artist: "Post Malone",
    src: "Post Malone - Sunflower (Lyrics) ft. Swae Lee.mp3",
    trivia: "Into the Spider-Verse hit track.",
    cover: "sunflower.jpg"
  },

  {
    title: "Running of the Hill",
    artist: "Kate Bush",
    src: "Kate Bush - Running Up That Hill (Lyrics)  From Stranger Things Season 4 Soundtrack.mp3",
    trivia: "Stranger things season 4",
    cover: "stranger.jpeg"
  }
];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function loadTrack(index) {
  if (!playlist.length) return;
  currentTrack = index;
  const track = playlist[index];
  audio.src = track.src;
  document.querySelector(".title").textContent = track.title;
  document.querySelector(".cover").src = track.cover || "default.jpg";
  triviaContent.textContent = "Click play to learn something fun!";
  progress.value = 0;
  updateQueueUI();

  // NEW: set currentSongObj when loading from playlist
  currentSongObj = track;
}

function playTrack(index) {
  loadTrack(index);
  audio.play();
  playPauseBtn.textContent = "⏸️";
  triviaContent.textContent = playlist[index]?.trivia || "";

  // currentSongObj already set by loadTrack
}

// 🎵 Show Song Information (replaced alert with popup and correct detection)
function showSongInfo() {
  // find best candidate for currently playing song
  let song = null;

  // 1) If playing a queued song with valid index
  if (playlist.length && currentTrack >= 0 && playlist[currentTrack]) {
    song = playlist[currentTrack];
  }

  // 2) If we've stored an object when playing directly from recommendations
  if (!song && currentSongObj) {
    song = currentSongObj;
  }

  // 3) If still no song, try to match audio.src with an entry in allSongs
  if (!song && audio.src && audio.src !== window.location.href) {
    // match by filename or substring (robust to absolute vs relative src)
    song = allSongs.find(s => {
      try {
        return audio.src.includes(s.src);
      } catch {
        return false;
      }
    }) || null;
  }

  // Show popup with song info or 'no song' message
  if (!song) {
    openSongInfoPopup("ℹ️ No song is currently playing.");
    return;
  }

  const album = song.album || "Unknown Album";
  const content = `
    <div class="song-info-block">
      <h3>🎶 Song Information</h3>
      <p><strong>Title:</strong> ${song.title}</p>
      <p><strong>Artist:</strong> ${song.artist || "Unknown"}</p>
      <p><strong>Album:</strong> ${album}</p>
    </div>
  `;
  openSongInfoPopup(content);
}

// 🎯 Attach click event to Info button
document.getElementById("infoBtn").addEventListener("click", showSongInfo);

// Reusable popup creator (no inline styles except classes)
function openSongInfoPopup(innerHTML) {
  // prevent multiple popups
  const existing = document.getElementById("song-info-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "song-info-overlay";
  overlay.className = "song-info-overlay";

  const box = document.createElement("div");
  box.className = "song-info-box";

  // build content
  box.innerHTML = `
    <div class="song-info-content">${innerHTML}</div>
    <button class="song-info-close" aria-label="Close">Close</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // close handlers
  box.querySelector(".song-info-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function togglePlay() {
  if (!audio.src || audio.src === window.location.href) {
    triviaContent.textContent = "🎵 Silence is golden... but not as groovy as a good tune. Pick a song!";
    return;
  }

  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸️";
    if (currentTrack >= 0) {
      triviaContent.textContent = playlist[currentTrack]?.trivia || "";
    }
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶️";
  }
}

function prevTrack() {
  if (!playlist.length) return;
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  playTrack(currentTrack);
}

function nextTrack() {
  if (!playlist.length) return;
  currentTrack = (currentTrack + 1) % playlist.length;
  playTrack(currentTrack);
}

function updateProgress() {
  progress.value = audio.currentTime;
  progress.max = audio.duration || 0;
}

function seekAudio() {
  audio.currentTime = progress.value;
}

function updateQueueUI() {
  queueList.innerHTML = "";
  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.title;
    li.classList.add("queue-item");
    if (index === currentTrack) li.classList.add("playing");

    li.addEventListener("click", () => playTrack(index));
    li.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showQueueContextMenu(e.pageX, e.pageY, index);
    });

    queueList.appendChild(li);
  });
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allSongs.filter(song =>
    song.title.toLowerCase().includes(query)
  );
  loadRecommendations(filtered);
});

function loadRecommendations(songList = allSongs) {
  const shuffled = shuffle(songList).slice(0, 8);
  recommendedList.innerHTML = "";

  shuffled.forEach(song => {
    const li = document.createElement("li");
    li.textContent = song.title;

    li.addEventListener("click", () => {
      const indexInQueue = playlist.findIndex(p => p.title === song.title);
      if (indexInQueue !== -1) {
        playTrack(indexInQueue);
      } else {
        audio.src = song.src;
        document.querySelector(".title").textContent = song.title;
        document.querySelector(".cover").src = song.cover || "default.jpg";
        triviaContent.textContent = song.trivia || "Click play to learn something fun!";
        audio.play();
        playPauseBtn.textContent = "⏸️";
        currentTrack = -1;

        // NEW: when playing directly from recommendations, set currentSongObj
        currentSongObj = song;
      }
    });

    li.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, song);
    });

    recommendedList.appendChild(li);
  });
}

function showContextMenu(x, y, song) {
  const menuWidth = 160;
  const menuHeight = 80;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const adjustedX = (x + menuWidth > viewportWidth) ? (viewportWidth - menuWidth - 10) : x;
  const adjustedY = (y + menuHeight > viewportHeight) ? (viewportHeight - menuHeight - 10) : y;

  contextMenu.style.left = `${adjustedX}px`;
  contextMenu.style.top = `${adjustedY}px`;
  contextMenu.style.display = "block";

  document.getElementById("addToQueue").onclick = () => {
    const alreadyInQueue = playlist.some(p => p.title === song.title);
    if (!alreadyInQueue) {
      playlist.push(song);
      updateQueueUI();
      alert(`🎶 "${song.title}" added to the queue!`);
    } else {
      alert(`ℹ️ "${song.title}" is already in the queue.`);
    }
    contextMenu.style.display = "none";
  };

  document.getElementById("addToPlaylist").onclick = () => {
  const playlistName = prompt("Enter playlist name to add this song to:");

  if (!playlistName) {
    contextMenu.style.display = "none";
    return;
  }

  // If playlist doesn't exist, create it
  if (!savedPlaylists[playlistName]) {
    if (!confirm(`Playlist "${playlistName}" doesn't exist. Create it?`)) {
      contextMenu.style.display = "none";
      return;
    }
    savedPlaylists[playlistName] = [];
  }

  // Check for duplicates
  const alreadyExists = savedPlaylists[playlistName].some(
    (s) => s.title === song.title
  );

  if (!alreadyExists) {
    savedPlaylists[playlistName].push(song);
    localStorage.setItem("zetaPlaylists", JSON.stringify(savedPlaylists));
    alert(`✅ "${song.title}" added to "${playlistName}"`);
  } else {
    alert(`⚠️ "${song.title}" is already in "${playlistName}"`);
  }

  contextMenu.style.display = "none";
};

}

const audioElement = document.querySelector("audio"); // Replace with your actual audio element
const volumeControl = document.getElementById("volumeControl");

volumeControl.addEventListener("input", function () {
  audioElement.volume = this.value;
});

function showQueueContextMenu(x, y, index) {
  // Remove any old menu first
  const oldMenu = document.getElementById("queueContextMenu");
  if (oldMenu) oldMenu.remove();

  const track = playlist[index];

  const queueMenu = document.createElement("div");
  queueMenu.id = "queueContextMenu";
  queueMenu.style.position = "absolute";
  queueMenu.style.background = "#222";
  queueMenu.style.color = "#fff";
  queueMenu.style.padding = "8px";
  queueMenu.style.borderRadius = "6px";
  queueMenu.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
  queueMenu.style.zIndex = 1001;
  queueMenu.innerHTML = `
    <div class="queue-option" data-action="remove">❌ Remove from Queue</div>
    <div class="queue-option" data-action="share">📤 Share</div>
  `;

  // Adjust position to avoid overflow
  const menuWidth = 160;
  const menuHeight = 80;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const adjustedX = (x + menuWidth > viewportWidth) ? (viewportWidth - menuWidth - 10) : x;
  const adjustedY = (y + menuHeight > viewportHeight) ? (viewportHeight - menuHeight - 10) : y;

  queueMenu.style.left = `${adjustedX}px`;
  queueMenu.style.top = `${adjustedY}px`;

  // Attach functionality AFTER it's in the DOM
  document.body.appendChild(queueMenu);

  // Handle clicks on the options
  queueMenu.addEventListener("click", (e) => {
    const action = e.target.getAttribute("data-action");
    if (action === "remove") {
      // Handle remove
      playlist.splice(index, 1);
      if (currentTrack === index) {
        audio.pause();
        audio.src = "";
        document.querySelector(".title").textContent = "";
        document.querySelector(".cover").src = "default.jpg";
        triviaContent.textContent = "Track removed from queue.";

        // NEW: clear currentSongObj if the currently playing queued track was removed
        currentSongObj = null;
      } else if (index < currentTrack) {
        currentTrack--;
      }
      updateQueueUI();
    } else if (action === "share") {
      // Handle share
      const dummy = document.createElement("input");
      dummy.value = `${track.title} by ${track.artist}`;
      document.body.appendChild(dummy);
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      alert(`🔗 Copied to clipboard: "${track.title}" by ${track.artist}`);
    }
    queueMenu.remove();
    e.stopPropagation();
  });

  // Hide on outside click
  setTimeout(() => {
    document.addEventListener("click", function hideMenu(event) {
      if (!queueMenu.contains(event.target)) {
        queueMenu.remove();
        document.removeEventListener("click", hideMenu);
      }
    });
  }, 0);
}

// Context menu base
const contextMenu = document.createElement("div");
contextMenu.id = "customContextMenu";
contextMenu.style.position = "absolute";
contextMenu.style.display = "none";
contextMenu.style.background = "#222";
contextMenu.style.color = "#fff";
contextMenu.style.padding = "8px";
contextMenu.style.borderRadius = "6px";
contextMenu.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
contextMenu.style.zIndex = 1000;
contextMenu.innerHTML = `
  <div id="addToQueue">➕ Add to Queue</div>
  <div id="addToPlaylist">🎵 Add to Playlist</div>
`;
document.body.appendChild(contextMenu);

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.style.display = "none";
  }
});

// Spacebar play/pause
document.addEventListener("keydown", function (event) {
  const isTyping = document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA";
  if (!isTyping && event.code === "Space") {
    event.preventDefault();
    togglePlay();
  }
});

// Controls
playPauseBtn.addEventListener("click", togglePlay);
document.getElementById("prevBtn").addEventListener("click", prevTrack);
document.getElementById("nextBtn").addEventListener("click", nextTrack);
progress.addEventListener("input", seekAudio);
audio.addEventListener("timeupdate", updateProgress);

audio.addEventListener("ended", () => {
  if (playlist.length && currentTrack + 1 < playlist.length) {
    currentTrack++;
    playTrack(currentTrack);
  } else {
    playPauseBtn.textContent = "▶️";
    triviaContent.textContent = "🎵 The track is over. Ready for your next jam?";
    audio.src = "";

    // NEW: clear currentSongObj when a track ends and no new track is played
    currentSongObj = null;

    updateQueueUI();
  }
});

loadRecommendations();
triviaContent.textContent = "🎵 Silence is golden... but not as groovy as a good tune. Pick a song!";

const defaultSongs = [
  { title: "Blinding Lights – The Weeknd" },
  { title: "Levitating – Dua Lipa" },
  { title: "Peaches – Justin Bieber" }
];

