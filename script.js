const { Player } = TextAliveApp;

// ここを対象曲URLに変更
const SONG_URL = "https://www.youtube.com/watch?v=ygY2qObZv24";

// TextAlive App Token
const APP_TOKEN = "IWGcvQmDMQHpO49o";

const mainLyricEl = document.getElementById("mainLyric");
const subLyricEl = document.getElementById("subLyric");
const playButton = document.getElementById("playButton");
const timeEl = document.getElementById("time");
const mediaEl = document.getElementById("media");

let player = null;
let ready = false;
let lastBeatIndex = -1;
let beatTimer = null;
let currentPhraseStart = null;

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function getTypedText(text, progress) {
  const chars = Array.from(text || "");
  const clamped = Math.max(0, Math.min(1, progress));
  const count = Math.max(0, Math.ceil(chars.length * clamped));
  return chars.slice(0, count).join("");
}

function animatePhrase(now, phrase) {
  if (!phrase.contains(now)) return;

  const text = phrase.text || "";
  const start = phrase.startTime ?? now;
  const end = phrase.endTime ?? (start + 1000);
  const duration = Math.max(1, end - start);
  const progress = (now - start) / duration;

  if (currentPhraseStart !== start) {
    currentPhraseStart = start;
    mainLyricEl.classList.remove("line-in");
    void mainLyricEl.offsetWidth;
    mainLyricEl.classList.add("line-in");
  }

  mainLyricEl.textContent = getTypedText(text, progress);

  if (phrase.next) {
    subLyricEl.textContent = phrase.next.text;
  } else {
    subLyricEl.textContent = "";
  }
}

function triggerBeat() {
  document.body.classList.add("beat");
  clearTimeout(beatTimer);
  beatTimer = setTimeout(() => {
    document.body.classList.remove("beat");
  }, 120);
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
      mainLyricEl.textContent = "";
      subLyricEl.textContent = "";
      currentPhraseStart = null;
      lastBeatIndex = -1;
    },

    onTimeUpdate(position) {
      timeEl.textContent = formatTime(position);

      const beat = player.findBeat(position);
      if (beat && beat.index !== lastBeatIndex) {
        lastBeatIndex = beat.index;
        triggerBeat();
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

setupPlayer();
