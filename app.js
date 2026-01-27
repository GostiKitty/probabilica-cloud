const tg = window.Telegram?.WebApp;

function initTelegramUi() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#0A0A0A");
    tg.setBackgroundColor?.("#0A0A0A");
  } catch {}
}

function initData() {
  return tg?.initData || "";
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-InitData": initData(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.detail || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const el = (id) => document.getElementById(id);
const ui = {
  subtitle: el("subtitle"),
  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  name: el("name"),
  id: el("id"),
  lastResult: el("lastResult"),
  hint: el("hint"),

  btnSpin: el("btnSpin"),
  btnAvatar: el("btnAvatar"),
  btnRefresh: el("btnRefresh"),
  btnRules: el("btnRules"),
  btnSupport: el("btnSupport"),

  modal: el("modal"),
  modalBackdrop: el("modalBackdrop"),
  modalTitle: el("modalTitle"),
  modalBody: el("modalBody"),
  modalClose: el("modalClose"),

  // wheel
  wheelSegments: el("wheelSegments"),
  wheelRing: el("wheelRing"),

  // profile avatar
  avatarDot: el("avatarDot"),
  avatarName: el("avatarName"),
  avatarId: el("avatarId"),

  // avatar maker modal
  avatarModal: el("avatarModal"),
  avatarBackdrop: el("avatarBackdrop"),
  avatarClose: el("avatarClose"),
  avatarCancel: el("avatarCancel"),
  makerDot: el("makerDot"),
  makerSymbol: el("makerSymbol"),
  makerName: el("makerName"),
  makerSymbolInput: el("makerSymbolInput"),
  makerColor: el("makerColor"),
  makerRandom: el("makerRandom"),
  makerSave: el("makerSave"),
  makerHint: el("makerHint"),
};

function setHint(msg) {
  ui.hint.textContent = msg || "";
}

function openModal(title, body) {
  ui.modalTitle.textContent = title || "";
  ui.modalBody.textContent = body || "";
  ui.modal.hidden = false;
}
function closeModal() { ui.modal.hidden = true; }

ui.modalBackdrop.addEventListener("click", closeModal);
ui.modalClose.addEventListener("click", closeModal);

function setLoading(on) {
  const nodes = [ui.coins, ui.level, ui.xp, ui.name, ui.id, ui.lastResult];
  for (const n of nodes) {
    if (!n) continue;
    n.classList.toggle("skeleton", on);
    if (on) n.textContent = "";
  }
}

function setMakerHint(msg) {
  ui.makerHint.textContent = msg || "";
}

/* ---------------------------
   AVATAR: encode/decode
   avatar_id хранится строкой: "gen|<hex>|<sym>|<name>"
---------------------------- */
function safeStr(s) {
  return String(s || "").replaceAll("|", "").trim().slice(0, 18);
}
function encodeAvatar({ colorHex, symbol, name }) {
  const hex = (colorHex || "#A78BFA").toUpperCase();
  const sym = safeStr(symbol || "◻︎").slice(0, 2) || "◻︎";
  const nm = safeStr(name || "Avatar") || "Avatar";
  return `gen|${hex}|${sym}|${nm}`;
}
function decodeAvatar(avatarId) {
  const a = String(avatarId || "");
  if (!a.startsWith("gen|")) {
    return { colorHex: "#A78BFA", symbol: "◻︎", name: a || "Avatar", raw: a || "a1" };
  }
  const [, hex, sym, nm] = a.split("|");
  return {
    colorHex: hex || "#A78BFA",
    symbol: sym || "◻︎",
    name: nm || "Avatar",
    raw: a,
  };
}

function applyAvatarToProfile(avatarId) {
  const av = decodeAvatar(avatarId);
  ui.avatarDot.style.background = av.colorHex;
  ui.avatarDot.style.borderColor = "rgba(255,255,255,0.10)";
  ui.avatarName.textContent = `${av.symbol} ${av.name}`;
  ui.avatarId.textContent = av.raw;
}

function applyAvatarToMaker({ colorHex, symbol, name }) {
  ui.makerDot.style.background = colorHex;
  ui.makerSymbol.textContent = symbol;
  if (name != null) ui.makerName.value = name;
  if (symbol != null) ui.makerSymbolInput.value = symbol;
  if (colorHex != null) ui.makerColor.value = colorHex;
}

/* ---------------------------
   WHEEL: визуальный спин
---------------------------- */
const WHEEL = [
  { label: "+5", weight: 32 },
  { label: "+10", weight: 22 },
  { label: "+15", weight: 16 },
  { label: "+20", weight: 12 },
  { label: "+30", weight: 9 },
  { label: "x2 XP", weight: 6 },
  { label: "Rare", weight: 3 },
];

let wheelAngle = 0;
let spinning = false;

function buildWheel() {
  if (!ui.wheelSegments) return;

  const n = WHEEL.length;
  const step = 360 / n;

  // фон сегментов (conic-gradient)
  const colors = WHEEL.map((_, i) =>
    i % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
  );
  ui.wheelSegments.style.background =
    `conic-gradient(${colors.map((c, i) => `${c} ${i*step}deg ${(i+1)*step}deg`).join(",")})`;

  // подписи сегментов
  ui.wheelSegments.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const lab = document.createElement("div");
    lab.className = "wheel__label";
    const a = i * step + step / 2;
    lab.style.transform = `rotate(${a}deg) translateY(-78px) rotate(${-a}deg)`;
    lab.textContent = WHEEL[i].label;
    ui.wheelSegments.appendChild(lab);
  }

  // центр
  if (!ui.wheelRing.querySelector(".wheel__center")) {
    const c = document.createElement("div");
    c.className = "wheel__center";
    c.innerHTML = "<span>SPIN</span>";
    ui.wheelRing.appendChild(c);
  }
}

// добавим стили лейблов колёсика программно (чтобы не раздувать css)
(function injectWheelLabelCss(){
  const css = `
    .wheel__label{
      position:absolute;
      left:50%;
      top:50%;
      transform-origin:center;
      font-size:12px;
      font-weight:650;
      letter-spacing:-0.01em;
      color: rgba(255,255,255,0.85);
      text-shadow: 0 10px 18px rgba(0,0,0,0.5);
      translate: -50% -50%;
      pointer-events:none;
      white-space:nowrap;
    }
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
})();

function setWheel(angleDeg) {
  wheelAngle = angleDeg;
  ui.wheelSegments.style.transform = `rotate(${wheelAngle}deg)`;
}

function pickWheelIndex() {
  // просто фронтовый выбор для анимации (результат всё равно будет с сервера)
  const sum = WHEEL.reduce((a, x) => a + x.weight, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < WHEEL.length; i++) {
    r -= WHEEL[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

/* ---------------------------
   PROFILE RENDER
---------------------------- */
let currentAvatarId = "a1";

function renderProfile(p) {
  setLoading(false);

  ui.coins.textContent = String(p.coins ?? 0);
  ui.level.textContent = String(p.level ?? 1);
  ui.xp.textContent = String(p.xp ?? 0);

  ui.name.textContent = p.username || p.first_name || "player";
  ui.id.textContent = String(p.user_id || "");

  currentAvatarId = p.avatar_id || currentAvatarId || "a1";
  applyAvatarToProfile(currentAvatarId);

  ui.lastResult.classList.remove("skeleton");
}

async function loadMe() {
  setLoading(true);
  setHint("Загрузка…");
  const me = await api("/api/me");
  renderProfile(me);
  setHint("");
}

/* ---------------------------
   SPIN: анимация + серверный результат
---------------------------- */
async function spin() {
  if (spinning) return;
  spinning = true;

  ui.btnSpin.disabled = true;
  ui.btnAvatar.disabled = true;
  setHint("Крутка…");

  // анимация (фронт)
  const n = WHEEL.length;
  const step = 360 / n;
  const idx = pickWheelIndex();

  // хотим, чтобы указатель (сверху) попал в центр сегмента idx
  // pointer at 0deg (top). conic starts at 0deg to the right by default, но мы уже визуально ок.
  // поэтому просто "докрутим" на несколько оборотов + нужный угол.
  const targetAngle = (360 * 4) + (idx * step) + (step / 2);
  const from = wheelAngle % 360;
  const to = from + targetAngle;

  ui.wheelSegments.style.transition = "transform 1200ms cubic-bezier(.10,.72,.10,1)";
  setWheel(to);

  // параллельно запрос на сервер
  let serverResult = null;
  try {
    serverResult = await api("/api/spin", {});
  } catch (e) {
    // если сервер упал — всё равно остановим анимацию и покажем ошибку
    setHint(e.message || "Ошибка");
  }

  // после анимации
  setTimeout(() => {
    ui.wheelSegments.style.transition = "transform 900ms cubic-bezier(.12,.72,.11,1)";

    if (serverResult) {
      ui.lastResult.textContent = serverResult.text || serverResult.result_text || "Готово";
      if (serverResult.profile) renderProfile(serverResult.profile);
      setHint("");
    }

    ui.btnSpin.disabled = false;
    ui.btnAvatar.disabled = false;
    spinning = false;
  }, 1250);
}

/* ---------------------------
   AVATAR MAKER MODAL
---------------------------- */
function openAvatarMaker() {
  ui.avatarModal.hidden = false;

  // подставим текущий аватар в конструктор
  const av = decodeAvatar(currentAvatarId);
  applyAvatarToMaker(av);
  setMakerHint("");
}
function closeAvatarMaker() {
  ui.avatarModal.hidden = true;
  setMakerHint("");
}

ui.avatarBackdrop.addEventListener("click", closeAvatarMaker);
ui.avatarClose.addEventListener("click", closeAvatarMaker);
ui.avatarCancel.addEventListener("click", closeAvatarMaker);

function randomHex() {
  const h = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  return ("#" + h).toUpperCase();
}
function randomSymbol() {
  const symbols = ["◻︎","◼︎","▣","⬚","◦","▪︎","◇","◆","△","▽","○","●"];
  return symbols[Math.floor(Math.random() * symbols.length)];
}
function randomName() {
  const names = ["Noir","Glass","Zen","Bold","Classic","Neo","Lumen","Pulse","Nova","Astra"];
  return names[Math.floor(Math.random() * names.length)];
}

function refreshMakerPreview() {
  const colorHex = ui.makerColor.value || "#A78BFA";
  const symbol = (ui.makerSymbolInput.value || "◻︎").slice(0, 2);
  ui.makerDot.style.background = colorHex;
  ui.makerSymbol.textContent = symbol || "◻︎";
}

ui.makerColor.addEventListener("input", refreshMakerPreview);
ui.makerSymbolInput.addEventListener("input", refreshMakerPreview);

ui.makerRandom.addEventListener("click", () => {
  applyAvatarToMaker({ colorHex: randomHex(), symbol: randomSymbol(), name: randomName() });
  refreshMakerPreview();
});

ui.makerSave.addEventListener("click", async () => {
  const colorHex = ui.makerColor.value || "#A78BFA";
  const symbol = (ui.makerSymbolInput.value || "◻︎").slice(0, 2) || "◻︎";
  const name = (ui.makerName.value || "Avatar").trim() || "Avatar";

  const avatar_id = encodeAvatar({ colorHex, symbol, name });

  ui.makerSave.disabled = true;
  ui.makerRandom.disabled = true;
  setMakerHint("Сохранение…");

  try {
    const r = await api("/api/avatar", { avatar_id });
    if (r.profile) renderProfile(r.profile);
    currentAvatarId = avatar_id;
    applyAvatarToProfile(currentAvatarId);

    setMakerHint("Сохранено");
    setTimeout(() => closeAvatarMaker(), 250);
  } catch (e) {
    setMakerHint(e.message || "Ошибка");
  } finally {
    ui.makerSave.disabled = false;
    ui.makerRandom.disabled = false;
  }
});

/* ---------------------------
   UI bindings
---------------------------- */
ui.btnSpin.addEventListener("click", spin);
ui.btnAvatar.addEventListener("click", openAvatarMaker);
ui.btnRefresh.addEventListener("click", () => loadMe().catch(err => setHint(err.message)));

ui.btnRules.addEventListener("click", () =>
  openModal("Правила", "Игра использует внутриигровые очки. Реальные деньги не участвуют.")
);
ui.btnSupport.addEventListener("click", () =>
  openModal("Поддержка", "Если что-то не работает, откройте игру заново и нажмите «Обновить».")
);

/* ---------------------------
   Boot
---------------------------- */
(async function boot() {
  initTelegramUi();
  buildWheel();

  // стартовое положение
  setWheel(0);

  if (!initData()) {
    ui.subtitle.textContent = "Открывайте через Telegram";
    setHint("Запустите мини-приложение из бота.");
    setLoading(false);
    return;
  }

  try {
    await loadMe();
    refreshMakerPreview();
  } catch (e) {
    setLoading(false);
    setHint(e.message || "Ошибка загрузки");
  }
})();
