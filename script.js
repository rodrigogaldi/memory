const board = document.getElementById("board");
const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const totalEl = document.getElementById("total");
const resetBtn = document.getElementById("reset");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const splash = document.getElementById("splash");
const startBtn = document.getElementById("start-game");
const finish = document.getElementById("finish");
const restartBtn = document.getElementById("restart-game");
const appContainers = [document.querySelector("header"), document.querySelector("main")];
const CARD_ASPECT = 3 / 4;
let resizeObserver;

const GAME_DATA = {
  platform: {
    logoText: "Memória+",
    subtitle: "Vire as cartas e desbloqueie conteúdos especiais",
  },
  cards: [
    { id: "c1a", pairId: "p1", label: "Sol", icon: "☀️" },
    { id: "c1b", pairId: "p1", label: "Sol", icon: "☀️" },
    { id: "c2a", pairId: "p2", label: "Lua", icon: "🌙" },
    { id: "c2b", pairId: "p2", label: "Lua", icon: "🌙" },
    { id: "c3a", pairId: "p3", label: "Mar", icon: "🌊" },
    { id: "c3b", pairId: "p3", label: "Mar", icon: "🌊" },
    { id: "c4a", pairId: "p4", label: "Vento", icon: "💨" },
    { id: "c4b", pairId: "p4", label: "Vento", icon: "💨" },
    { id: "c5a", pairId: "p5", label: "Montanha", icon: "⛰️" },
    { id: "c5b", pairId: "p5", label: "Montanha", icon: "⛰️" },
    { id: "c6a", pairId: "p6", label: "Floresta", icon: "🌿" },
    { id: "c6b", pairId: "p6", label: "Floresta", icon: "🌿" },
  ],
  rewards: {
    p1: {
      title: "Sol desbloqueado",
      text: "Você encontrou o par do Sol. Que tal começar o dia com energia?",
      videoUrl: "",
    },
    p2: {
      title: "Lua desbloqueada",
      text: "A noite guarda segredos. Respire fundo e continue.",
      videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    },
    p3: {
      title: "Mar desbloqueado",
      text: "As ondas trazem histórias de longe.",
      videoUrl: "",
    },
    p4: {
      title: "Vento desbloqueado",
      text: "O vento muda caminhos. Continue explorando!",
      videoUrl: "",
    },
    p5: {
      title: "Montanha desbloqueada",
      text: "Topo alcançado. Você está indo muito bem!",
      videoUrl: "",
    },
    p6: {
      title: "Floresta desbloqueada",
      text: "A floresta inspira novas ideias.",
      videoUrl: "",
    },
  },
};

let state = {
  first: null,
  second: null,
  lock: false,
  moves: 0,
  matches: 0,
  total: 0,
  rewards: {},
  totalCards: 0,
  pendingFinish: false,
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resetState(totalPairs) {
  state = {
    ...state,
    first: null,
    second: null,
    lock: false,
    moves: 0,
    matches: 0,
    pendingFinish: false,
    total: totalPairs,
  };
  movesEl.textContent = "0";
  matchesEl.textContent = "0";
  totalEl.textContent = String(totalPairs);
}

function buildCard(card) {
  const wrapper = document.createElement("button");
  wrapper.className = "card";
  wrapper.type = "button";
  wrapper.dataset.pair = card.pairId;
  wrapper.dataset.id = card.id;

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const back = document.createElement("div");
  back.className = "card-face card-back";
  back.innerHTML = "?";

  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.innerHTML = `
    <div class="card-icon">${card.icon ?? "❓"}</div>
    <div class="card-label">${card.label ?? "Carta"}</div>
  `;

  inner.appendChild(back);
  inner.appendChild(front);
  wrapper.appendChild(inner);

  wrapper.addEventListener("click", () => handleFlip(wrapper));

  return wrapper;
}

function handleFlip(cardEl) {
  if (state.lock || cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) {
    return;
  }

  cardEl.classList.add("flipped");

  if (!state.first) {
    state.first = cardEl;
    return;
  }

  state.second = cardEl;
  state.lock = true;
  state.moves += 1;
  movesEl.textContent = String(state.moves);

  const isMatch = state.first.dataset.pair === state.second.dataset.pair;

  if (isMatch) {
    state.first.classList.add("matched");
    state.second.classList.add("matched");
    state.matches += 1;
    matchesEl.textContent = String(state.matches);
    const pairId = state.first.dataset.pair;
    const reward = state.rewards[pairId];
    if (reward) {
      setTimeout(() => openModal(reward), 450);
    }
    if (state.matches === state.total) {
      if (reward) {
        state.pendingFinish = true;
      } else {
        setTimeout(() => showFinish(), 450);
      }
    }
    resetPick();
  } else {
    setTimeout(() => {
      state.first.classList.remove("flipped");
      state.second.classList.remove("flipped");
      resetPick();
    }, 900);
  }
}

function resetPick() {
  state.first = null;
  state.second = null;
  state.lock = false;
}

function openModal(reward) {
  modalTitle.textContent = reward.title ?? "Par encontrado";
  modalBody.innerHTML = "";

  if (reward.text) {
    const text = document.createElement("p");
    text.textContent = reward.text;
    modalBody.appendChild(text);
  }

  if (reward.videoUrl) {
    const videoEl = buildVideo(reward.videoUrl);
    if (videoEl) {
      modalBody.appendChild(videoEl);
    }
  }

  if (!reward.text && !reward.videoUrl) {
    const fallback = document.createElement("p");
    fallback.textContent = "Sem conteúdo configurado para este par.";
    modalBody.appendChild(fallback);
  }

  modal.setAttribute("aria-hidden", "false");
}

function buildVideo(url) {
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  if (isYoutube) {
    const iframe = document.createElement("iframe");
    iframe.src = toYoutubeEmbed(url);
    iframe.title = "Video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    return iframe;
  }

  const video = document.createElement("video");
  video.controls = true;
  video.src = url;
  return video;
}

function toYoutubeEmbed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
    }
    const id = parsed.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch (err) {
    return url;
  }
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  modalBody.innerHTML = "";
  if (state.pendingFinish) {
    state.pendingFinish = false;
    showFinish();
  }
}

modal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close")) {
    closeModal();
  }
});

resetBtn.addEventListener("click", () => {
  init();
});

function setupGame(data) {
  if (data.platform) {
    const logoText = document.querySelector(".logo-text");
    const subtitle = document.querySelector(".subtitle");
    if (data.platform.logoText) logoText.textContent = data.platform.logoText;
    if (data.platform.subtitle) subtitle.textContent = data.platform.subtitle;
  }
  if (data.platform) {
    const splashTitle = document.querySelector(".splash-title");
    const finishTitle = document.querySelector(".finish-title");
    if (splashTitle && data.platform.logoText) splashTitle.textContent = data.platform.logoText;
    if (finishTitle && data.platform.logoText) finishTitle.textContent = data.platform.logoText;
  }

  state.rewards = data.rewards ?? {};

  const cards = shuffle(data.cards ?? []);
  state.totalCards = cards.length;
  const pairs = new Set(cards.map((card) => card.pairId)).size;
  resetState(pairs);

  board.innerHTML = "";
  cards.forEach((card) => board.appendChild(buildCard(card)));

  requestAnimationFrame(() => updateBoardLayout(state.totalCards));

  if (!resizeObserver && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => updateBoardLayout(state.totalCards));
    resizeObserver.observe(board);
  }
}

function updateBoardLayout(totalCards) {
  if (!totalCards) return;

  const styles = getComputedStyle(board);
  const gap = parseFloat(styles.getPropertyValue("--gap")) || 16;
  const width = board.clientWidth;
  const height = board.clientHeight;

  if (!width || !height) return;

  const maxCols = Math.min(8, totalCards);
  let best = null;

  for (let cols = 2; cols <= maxCols; cols += 1) {
    const cardWidth = (width - gap * (cols - 1)) / cols;
    if (cardWidth <= 0) continue;
    const cardHeight = cardWidth / CARD_ASPECT;
    const rows = Math.ceil(totalCards / cols);
    const totalHeight = rows * cardHeight + gap * (rows - 1);
    const overflow = Math.max(0, totalHeight - height);
    const score = overflow === 0 ? -cardWidth : overflow;

    if (!best || score < best.score || (score === best.score && cardWidth > best.cardWidth)) {
      best = { cols, cardWidth, score };
    }
  }

  if (!best) return;

  board.style.setProperty("--cols", best.cols);
  board.style.setProperty("--card-width", `${best.cardWidth}px`);
}

async function init() {
  setupGame(GAME_DATA);
}

function showApp() {
  splash.setAttribute("aria-hidden", "true");
  finish.setAttribute("aria-hidden", "true");
  appContainers.forEach((el) => el.classList.remove("app-hidden"));
  init();
}

function hideApp() {
  appContainers.forEach((el) => el.classList.add("app-hidden"));
}

function showFinish() {
  finish.setAttribute("aria-hidden", "false");
  appContainers.forEach((el) => el.classList.add("app-hidden"));
}

hideApp();

startBtn.addEventListener("click", () => {
  showApp();
});

restartBtn.addEventListener("click", () => {
  showApp();
});
