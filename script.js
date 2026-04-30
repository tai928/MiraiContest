const { Player } = TextAliveApp;

// ここを好きな対象曲URLに変える
const SONG_URL = "https://www.youtube.com/watch?v=ygY2qObZv24";

// TextAlive App Token
const APP_TOKEN = "IWGcvQmDMQHpO49o";

const mainLyricEl = document.getElementById("mainLyric");
const subLyricEl = document.getElementById("subLyric");
const playButton = document.getElementById("playButton");
const timeEl = document.getElementById("time");
const mediaEl = document.getElementById("media");
const flashEl = document.getElementById("flash");

let player = null;
let ready = false;
let currentPhrase = "";
let lastBeatIndex = -1;
let beatTimer = null;

function createParticles() {
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("span");
    p.className = "particle";

    const size = 2 + Math.random() * 5;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDuration = `${5 + Math.random() * 5}s`;
    p.style.animationDelay = `${Math.random() * 4}s`;

    document.body.appendChild(p);
  }
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function updateLyric(text) {
  if (!text || text === currentPhrase) return;

  currentPhrase = text;
  mainLyricEl.textContent = text;

  mainLyricEl.classList.remove("pop");
  void mainLyricEl.offsetWidth;
  mainLyricEl.classList.add("pop");
}

function animatePhrase(now, phrase) {
  if (!phrase.contains(now)) return;

  updateLyric(phrase.text);

  if (phrase.next) {
    subLyricEl.textContent = phrase.next.text;
  } else {
    subLyricEl.textContent = "";
  }
}

function triggerFlash() {
  flashEl.classList.remove("active");
  void flashEl.offsetWidth;
  flashEl.classList.add("active");
}

function triggerBeat(beat) {
  document.body.classList.add("beat");

  mainLyricEl.classList.remove("beat-pop");
  void mainLyricEl.offsetWidth;
  mainLyricEl.classList.add("beat-pop");

  clearTimeout(beatTimer);
  beatTimer = setTimeout(() => {
    document.body.classList.remove("beat");
    mainLyricEl.classList.remove("beat-pop");
  }, 180);

  const beatIndex = typeof beat.index === "number" ? beat.index : 0;

  // 4拍ごとに少し強いフラッシュ
  if (beatIndex % 4 === 0) {
    triggerFlash();
  }
}

function setupPlayer() {
  player = new Player({
    app: {
      token: APP_TOKEN,
    },
    mediaElement: mediaEl,
    mediaBannerPosition: "bottom",
  });

  player.addListener({
    onAppReady(app) {
      if (!app.songUrl) {
        player.createFromSongUrl(SONG_URL);
      }
    },

    onVideoReady() {
      ready = true;
      playButton.disabled = false;

      let phrase = player.video.firstPhrase;
      while (phrase) {
        phrase.animate = animatePhrase;
        phrase = phrase.next;
      }
    },

    onPlay() {
      playButton.textContent = "Pause";
    },

    onPause() {
      playButton.textContent = "Play";
    },

    onStop() {
      playButton.textContent = "Play";
      timeEl.textContent = "0.0s";
      lastBeatIndex = -1;
    },

    onTimeUpdate(position) {
      timeEl.textContent = formatTime(position);

      const beat = player.findBeat(position);
      if (beat && beat.index !== lastBeatIndex) {
        lastBeatIndex = beat.index;
        triggerBeat(beat);
      }

      const chorus = player.findChorus(position);
      if (chorus) {
        document.body.classList.add("chorus");
      } else {
        document.body.classList.remove("chorus");
      }
    },
  });
}

playButton.disabled = true;

playButton.addEventListener("click", () => {
  if (!player || !ready) return;

  if (player.isPlaying) {
    player.requestPause();
  } else {
    player.requestPlay();
  }
});

createParticles();
setupPlayer();
