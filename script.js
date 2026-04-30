const { Player } = TextAliveApp;

// ここを対象曲URLに変更
const SONG_URL = "https://www.youtube.com/watch?v=ygY2qObZv24";

// TextAlive App Token
const APP_TOKEN = "IWGcvQmDMQHpO49o";

const prevLyricEl = document.getElementById("prevLyric");
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
let previousPhraseText = "";
let currentTypedSource = "";

function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function getTypedText(text, progress) {
  const chars = Array.from(text || "");
  const clamped = Math.max(0, Math.min(1, progress));

  // 最後に少し余韻を残すため、85%くらいで全文が出るようにする
  const adjusted = Math.min(1, clamped / 0.85);
  const count = Math.max(0, Math.ceil(chars.length * adjusted));

  return chars.slice(0, count).join("");
}

function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function updateSubLyric(text) {
  const nextText = text || "";
  if (subLyricEl.textContent === nextText) return;

  subLyricEl.textContent = nextText;
  restartAnimation(subLyricEl, "line-fade");
}

function updatePrevLyric(text) {
  const prevText = text || "";
  if (prevLyricEl.textContent === prevText) return;

  prevLyricEl.textContent = prevText;
  restartAnimation(prevLyricEl, "line-fade");
}

function onNewPhrase(phrase) {
  updatePrevLyric(previousPhraseText);

  currentTypedSource = phrase.text || "";
  mainLyricEl.textContent = "";
  restartAnimation(mainLyricEl, "line-in");

  if (phrase.next) {
    updateSubLyric(phrase.next.text);
  } else {
    updateSubLyric("");
  }

  previousPhraseText = currentTypedSource;
}

function animatePhrase(now, phrase) {
  if (!phrase.contains(now)) return;

  const start = phrase.startTime ?? now;
  const end = phrase.endTime ?? (start + 1000);
  const duration = Math.max(1, end - start);
  const progress = (now - start) / duration;

  if (currentPhraseStart !== start) {
    currentPhraseStart = start;
    onNewPhrase(phrase);
  }

  mainLyricEl.textContent = getTypedText(currentTypedSource, progress);
}

function triggerBeat() {
  document.body.classList.add("beat");

  clearTimeout(beatTimer);
  beatTimer = setTimeout(() => {
    document.body.classList.remove("beat");
  }, 115);
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

      mainLyricEl.textContent = "Press Play";
      subLyricEl.textContent = "lyrics will be typed here";
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

      prevLyricEl.textContent = "";
      mainLyricEl.textContent = "Press Play";
      subLyricEl.textContent = "";

      currentPhraseStart = null;
      previousPhraseText = "";
      currentTypedSource = "";
      lastBeatIndex = -1;

      document.body.classList.remove("beat");
      document.body.classList.remove("chorus");
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
