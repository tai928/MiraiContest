const { Player } = TextAliveApp;

const SONG_URL = "https://piapro.jp/t/6W2N";

// TextAlive App Token
const APP_TOKEN = "IWGcvQmDMQHpO49o";

const statusEl = document.querySelector("#status");
const mainLyricEl = document.querySelector("#mainLyric");
const subLyricEl = document.querySelector("#subLyric");
const beatEl = document.querySelector("#beat");
const stateEl = document.querySelector("#state");
const hostEl = document.querySelector("#host");
const modeEl = document.querySelector("#mode");
const playButton = document.querySelector("#playButton");
const seekButton = document.querySelector("#seekButton");

let player = null;
let ready = false;
let currentPhraseText = "";

function setStatus(text) {
  statusEl.textContent = text;
}

function setMainLyric(text) {
  if (!text || text === currentPhraseText) return;

  currentPhraseText = text;
  mainLyricEl.textContent = text;

  mainLyricEl.classList.remove("pop");
  void mainLyricEl.offsetWidth;
  mainLyricEl.classList.add("pop");
}

function createParticles() {
  for (let i = 0; i < 48; i++) {
    const p = document.createElement("span");
    p.className = "particle";

    const size = 2 + Math.random() * 5;

    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.animationDuration = `${2.4 + Math.random() * 3}s`;
    p.style.animationDelay = `${Math.random() * 3}s`;

    document.body.appendChild(p);
  }
}

function animatePhrase(now, unit) {
  if (!unit.contains(now)) return;

  setMainLyric(unit.text);

  if (unit.next) {
    subLyricEl.textContent = unit.next.text;
  } else {
    subLyricEl.textContent = "";
  }
}

function setupPlayer() {
  player = new Player({
    app: {
      token: APP_TOKEN,
    },
    mediaElement: document.querySelector("#media"),
    mediaBannerPosition: "bottom",
  });

  player.addListener({
    onAppReady(app) {
      hostEl.textContent = app.managed ? "ON" : "LOCAL";
      setStatus("app ready");

      if (!app.songUrl) {
        player.createFromSongUrl(SONG_URL);
      }
    },

    onVideoReady() {
      ready = true;
      setStatus("video ready");

      let phrase = player.video.firstPhrase;

      while (phrase) {
        phrase.animate = animatePhrase;
        phrase = phrase.next;
      }

      playButton.disabled = false;
      seekButton.disabled = false;
    },

    onTimerReady() {
      setStatus("ready to play");
    },

    onPlay() {
      stateEl.textContent = "PLAY";
      playButton.textContent = "Pause";
    },

    onPause() {
      stateEl.textContent = "STOP";
      playButton.textContent = "Play";
    },

    onStop() {
      stateEl.textContent = "STOP";
      playButton.textContent = "Play";
    },

    onTimeUpdate(position) {
      const beat = player.findBeat(position);
      const chorus = player.findChorus(position);

      if (beat) {
        beatEl.textContent = beat.position ?? beat.index ?? "0";
      }

      if (chorus) {
        document.body.classList.add("chorus");
        modeEl.textContent = "CHORUS MODE";
      } else {
        document.body.classList.remove("chorus");
        modeEl.textContent = "VERSE MODE";
      }
    },
  });
}

playButton.disabled = true;
seekButton.disabled = true;

playButton.addEventListener("click", () => {
  if (!player || !ready) return;

  if (player.isPlaying) {
    player.requestPause();
  } else {
    player.requestPlay();
  }
});

seekButton.addEventListener("click", () => {
  if (!player || !ready) return;
  player.requestMediaSeek(0);
});

createParticles();
setupPlayer();
