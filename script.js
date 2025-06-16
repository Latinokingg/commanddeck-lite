const API_KEY = '19dfa116c5628ff3194cb07b5db914c0';

function updateClock() {
  const now = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const dateStr = now.toLocaleDateString(undefined, options);

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;
  document.getElementById('date').textContent = dateStr;
  document.getElementById('clock').textContent = timeStr;
}

function getWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const temp = Math.round(data.main.temp);
      const desc = data.weather[0].description;
      const city = data.name;

      document.getElementById('weather-location').textContent = city;
      document.getElementById('weather-temp').textContent = `${temp}°C`;
      document.getElementById('weather-desc').textContent = desc.toUpperCase();
    })
    .catch(err => {
      document.getElementById('weather-location').textContent = 'Error loading weather';
      console.error(err);
    });
}

// Try to detect location and fetch weather, fallback to Auckland if denied
function detectLocationAndFetchWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        getWeather(latitude, longitude);
      },
      error => {
        // Fallback to Auckland coordinates if location denied
        getWeather(-36.8485, 174.7633);
        document.getElementById('weather-location').textContent = 'Using Auckland (location denied)';
        console.error(error);
      }
    );
  } else {
    // Fallback to Auckland if geolocation not supported
    getWeather(-36.8485, 174.7633);
    document.getElementById('weather-location').textContent = 'Using Auckland (geolocation not supported)';
  }
}

// ✅ Wait for DOM to be ready before starting
document.addEventListener('DOMContentLoaded', function () {
  updateClock();
  setInterval(updateClock, 1000);
  detectLocationAndFetchWeather();
});

// Favourites 

let favorites = [];

async function loadFavorites() {
  const saved = localStorage.getItem('favorites');
  if (saved) {
    favorites = JSON.parse(saved);
  } else {
    const res = await fetch('data/favorites.json');
    favorites = await res.json();
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
  renderFavorites();
}

function renderFavorites() {
  const grid = document.createElement('div');
  grid.className = 'favorites-grid';

  favorites.forEach((fav, index) => {
    const tile = document.createElement('a');
    tile.href = fav.url;
    tile.target = "_blank";
    tile.className = 'favorite-tile';
    tile.draggable = true;
    tile.dataset.index = index;

tile.innerHTML = `
  <img src="${fav.icon}" alt="${fav.title} icon" class="tile-icon">
  <span>${fav.title}</span>
`;

    addDragHandlers(tile);

    grid.appendChild(tile);
  });

  const panel = document.querySelector('.favorites-panel');
  panel.innerHTML = '<h2>Favorites</h2>';
  panel.appendChild(grid);
}

function addDragHandlers(tile) {
  tile.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', tile.dataset.index);
  });

  tile.addEventListener('dragover', e => {
    e.preventDefault();
    tile.style.border = '2px dashed #00ffff';
  });

  tile.addEventListener('dragleave', () => {
    tile.style.border = '1px solid #00ffff';
  });

  tile.addEventListener('drop', e => {
    e.preventDefault();
    tile.style.border = '1px solid #00ffff';

    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(tile.dataset.index);

    const moved = favorites.splice(fromIndex, 1)[0];
    favorites.splice(toIndex, 0, moved);

    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  detectLocationAndFetchWeather();
  loadFavorites();
});


// Toggle Edit Panel
document.getElementById('edit-toggle').addEventListener('click', () => {
  document.getElementById('editor-panel').classList.toggle('hidden');
  renderTileManager();
});

// Render Removable Tile List
function renderTileManager() {
  const container = document.getElementById('tile-manager');
  container.innerHTML = '';

  favorites.forEach((fav, index) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const text = document.createElement('span');
    text.textContent = `${fav.title} (${fav.url})`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      favorites.splice(index, 1);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      renderFavorites();
      renderTileManager();
    });

    row.appendChild(text);
    row.appendChild(removeBtn);
    container.appendChild(row);
  });
}

// Add New Tile
document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('new-title').value;
  const url = document.getElementById('new-url').value;
  const icon = document.getElementById('new-icon').value;

  favorites.push({ title, url, icon });
  localStorage.setItem('favorites', JSON.stringify(favorites));

  document.getElementById('add-form').reset();
  renderFavorites();
  renderTileManager();
});



const noteZone = document.getElementById('note-zone');
const addNoteBtn = document.getElementById('add-note-btn');
let notes = JSON.parse(localStorage.getItem('stickies')) || [];

function saveNotes() {
  localStorage.setItem('stickies', JSON.stringify(notes));
}

function renderNotes() {
  noteZone.innerHTML = '';
  notes.forEach((note, index) => {
    const noteEl = document.createElement('div');
    noteEl.className = 'note';
    noteEl.style.left = note.x + 'px';
    noteEl.style.top = note.y + 'px';
    noteEl.setAttribute('draggable', 'true');

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '❌';
    deleteBtn.onclick = () => {
      notes.splice(index, 1);
      saveNotes();
      renderNotes();
    };

    // Textarea
    const textarea = document.createElement('textarea');
    textarea.value = note.content;
    textarea.addEventListener('input', () => {
      notes[index].content = textarea.value;
      saveNotes();
    });

    // Drag logic
    noteEl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', index);
      noteEl.classList.add('dragging');
    });

    noteEl.addEventListener('dragend', e => {
      noteEl.classList.remove('dragging');
      notes[index].x = parseInt(noteEl.style.left);
      notes[index].y = parseInt(noteEl.style.top);
      saveNotes();
    });

    // Append to DOM
    noteEl.appendChild(deleteBtn);
    noteEl.appendChild(textarea);
    noteZone.appendChild(noteEl);
  });
}

// Handle drop movement globally
noteZone.addEventListener('dragover', e => {
  e.preventDefault();
  const dragging = document.querySelector('.note.dragging');
  if (dragging) {
    dragging.style.left = e.offsetX + 'px';
    dragging.style.top = e.offsetY + 'px';
  }
});

// Add Note button
addNoteBtn.addEventListener('click', () => {
  const newNote = {
    content: '',
    x: 50,
    y: 50
  };
  notes.push(newNote);
  saveNotes();
  renderNotes();
});

// Initial load
renderNotes();
