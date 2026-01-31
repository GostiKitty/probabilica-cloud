/* Probabilica app.js (frontend) — RU only, always жестко */

function el(id) { return document.getElementById(id); }
function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

const ui = {
  subtitle: el("subtitle"),

  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  glory: el("glory"),
  friendCode: el("friendCode"),
  btnCopy: el("btnCopy"),

  btnLang: el("btnLang"),
  btnSpicy: el("btnSpicy"),

  tabFight: el("tabFight"),
  tabFriends: el("tabFriends"),
  tabSlot: el("tabSlot"),
  panels: qa("[data-panel]"),

  ttlPve: el("ttlPve"),
  ttlPvp: el("ttlPvp"),
  ttlFriends: el("ttlFriends"),
  ttlSlot: el("ttlSlot"),
  ttlHistory: el("ttlHistory"),

  lblCoins: el("lblCoins"),
  lblLevel: el("lblLevel"),
  lblXp: el("lblXp"),
  lblGlory: el("lblGlory"),
  lblFriendCode: el("lblFriendCode"),

  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyHp: el("enemyHp"),
  stakes: qa(".stake"),

  friends: el("friends"),
  friendInput: el("friendInput"),
  btnAddFriend: el("btnAddFriend"),

  duels: el("duels"),
  pvpToId: el("pvpToId"),
  pvpStake: el("pvpStake"),
  btnCreateDuel: el("btnCreateDuel"),
  duelLog: el("duelLog"),
  btnRefreshDuels: el("btnRefreshDuels"),
  pvpStatus: el("pvpStatus"),

  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  payline: q(".payline"),
  slotGlow: el("slotGlow"),
  btnSlotSpin: el("btnSlotSpin"),
  btnAuto: el("btnAuto"),
  slotComment: el("slotComment"),
  slotHistory: el("slotHistory"),

  hint: el("hint"),
  toast: el("toast"),
};

function safeText(node, text) { if (node) node.textContent = text; }
function safeToggle(node, cls, on) { if (node) node.classList.toggle(cls, !!on); }

function safeClick(node, fn) {
  if (!node) return;
  node.addEventListener("click", (e) => { e.preventDefault(); fn(e); }, { passive: false });
  node.addEventListener("touchstart", (e) => { e.preventDefault(); fn(e); }, { passive: false });
}

/* Toast */
let toastTimer = null;
function toast(text, type = "info") {
  if (!ui.toast) return;
  if (toastTimer) clearTimeout(toastTimer);

  ui.toast.hidden = false;
  ui.toast.textContent = text;
  ui.toast.classList.remove("is-show", "is-win", "is-bad");
  if (type === "win") ui.toast.classList.add("is-win");
  if (type === "bad") ui.toast.classList.add("is-bad");

  ui.toast.getBoundingClientRect();
  ui.toast.classList.add("is-show");

  toastTimer = setTimeout(() => {
    ui.toast.classList.remove("is-show");
    setTimeout(() => { if (ui.toast) ui.toast.hidden = true; }, 220);
  }, 1400);
}

function tg() { return window.Telegram?.WebApp; }
function initData() { return tg()?.initData || ""; }
function haptic(type = "light") { try { tg()?.HapticFeedback?.impactOccurred?.(type); } catch {} }
function initTelegramUi() { try { tg()?.ready(); tg()?.expand(); } catch {} }

/* API */
async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-InitData": initData(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  return data;
}

/* RU labels */
function renderStaticText() {
  safeText(ui.subtitle, "Лобби");

  safeText(ui.lblCoins, "Монеты");
  safeText(ui.lblLevel, "Уровень");
  safeText(ui.lblXp, "Опыт");
  safeText(ui.lblGlory, "Glory");
  safeText(ui.lblFriendCode, "Friend code");
  safeText(ui.btnCopy, "Скопировать");

  safeText(ui.tabFight, "Fight");
  safeText(ui.tabFriends, "Friends");
  safeText(ui.tabSlot, "Slot");

  safeText(ui.ttlPve, "PvE");
  safeText(ui.ttlPvp, "PvP");
  safeText(ui.ttlFriends, "Friends");
  safeText(ui.ttlSlot, "Slot");
  safeText(ui.ttlHistory, "History");

  safeText(ui.btnAddFriend, "Добавить");
  safeText(ui.btnPveFight, "ЕБАШЬ");
  safeText(ui.btnCreateDuel, "ВЫЗВАТЬ НА РАЗБОР");
  safeText(ui.btnSlotSpin, "КРУТИ");
  safeText(ui.btnAuto, "АВТО (ОПАСНО)");

  if (ui.btnLang) ui.btnLang.hidden = true;
  if (ui.btnSpicy) ui.btnSpicy.hidden = true; // <- убрали навсегда
}

/* Tabs */
function showTab(name) {
  ui.panels.forEach(p => { p.hidden = (p.dataset.panel !== name); });
  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(b => b && b.classList.remove("is-active"));
  if (name === "fight") ui.tabFight?.classList.add("is-active");
  if (name === "friends") ui.tabFriends?.classList.add("is-active");
  if (name === "slot") ui.tabSlot?.classList.add("is-active");
}
safeClick(ui.tabFight, () => showTab("fight"));
safeClick(ui.tabFriends, () => showTab("friends"));
safeClick(ui.tabSlot, () => showTab("slot"));

/* Profile */
let ME = null;
function syncProfile(p) {
  safeText(ui.coins, String(p?.coins ?? 0));
  safeText(ui.level, String(p?.level ?? 1));
  safeText(ui.xp, String(p?.xp ?? 0));
  safeText(ui.glory, String(p?.glory ?? 0));
  safeText(ui.friendCode, String(p?.user_id ?? "0"));
}
async function loadMe() {
  const r = await api("/api/me");
  ME = r.profile;
  syncProfile(ME);
}

/* Copy friend code */
safeClick(ui.btnCopy, async () => {
  const code = (ui.friendCode?.textContent || "").trim();
  try { await navigator.clipboard.writeText(code); toast("Скопировано. Теперь иди и доминируй.", "win"); }
  catch { toast("Не скопировалось. Техника в истерике.", "bad"); }
});

/* ---------- SLOT ---------- */
const SYMBOL_LABEL = {
  BAR: "BAR",
  BELL: "🔔",
  SEVEN: "7",
  CHERRY: "🍒",
  STAR: "★",
  COIN: "¢",
  SCATTER: "💥",
};

const ORDER = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];
const REEL_ROW_H = 50;

function ensureReelHost(elHost) {
  if (!elHost) return null;
  let strip = elHost.querySelector(".reel-strip");
  if (!strip) {
    strip = document.createElement("div");
    strip.className = "reel-strip";
    elHost.innerHTML = "";
    elHost.appendChild(strip);
  }
  return strip;
}

function buildReelStrip(elHost) {
  const strip = ensureReelHost(elHost);
  if (!strip) return null;

  const repeats = 40;
  const rows = [];
  strip.innerHTML = "";

  for (let i = 0; i < ORDER.length * repeats; i++) {
    const s = ORDER[i % ORDER.length];
    rows.push(s);

    const d = document.createElement("div");
    d.className = `sym sym--${s}`;
    d.innerHTML = `<span>${SYMBOL_LABEL[s]}</span>`;
    strip.appendChild(d);
  }

  return { strip, rows };
}

const reel0 = buildReelStrip(ui.reel0);
const reel1 = buildReelStrip(ui.reel1);
const reel2 = buildReelStrip(ui.reel2);

function randomIndexOfSymbol(rows, symbol) {
  const idxs = [];
  for (let i = 0; i < rows.length; i++) if (rows[i] === symbol) idxs.push(i);
  return idxs[Math.floor(Math.random() * idxs.length)];
}

function setReelTarget(reel, symbol, extraTurns, durationMs) {
  if (!reel) return;
  const pick = randomIndexOfSymbol(reel.rows, symbol);
  const centerRow = 1;
  const base = (pick - centerRow) * REEL_ROW_H;
  const turns = extraTurns * reel.rows.length * REEL_ROW_H;
  const y = -(base + turns);
  reel.strip.style.transition = `transform ${durationMs}ms cubic-bezier(.12, .9, .2, 1)`;
  reel.strip.style.transform = `translateY(${y}px)`;
}

function normalizeReel(reel, symbol) {
  if (!reel) return;
  const pick = randomIndexOfSymbol(reel.rows, symbol);
  const centerRow = 1;
  const base = (pick - centerRow) * REEL_ROW_H;
  const y = -base;

  reel.strip.style.transition = "none";
  reel.strip.style.transform = `translateY(${y}px)`;
  reel.strip.getBoundingClientRect();
}

function setGlow(kind) {
  if (!ui.slotGlow) return;
  ui.slotGlow.classList.remove("is-win","is-big","is-bonus");
  if (kind === "win" || kind === "near") ui.slotGlow.classList.add("is-win");
  if (kind === "big") ui.slotGlow.classList.add("is-big");
  if (kind === "scatter") ui.slotGlow.classList.add("is-bonus");
  ui.payline?.classList.toggle("is-hit", kind === "win" || kind === "big" || kind === "scatter");
  if (kind === "near") ui.payline?.classList.remove("is-hit");
}

function slotJoke(kind) {
  const pack = {
    lose: [
      "Мимо. Как мои планы на нормальную жизнь.",
      "Система тебя узнала и такая: «нет».",
      "Сухо. Даже не смешно."
    ],
    near: [
      "НУ БЛЯДЬ. Почти.",
      "Рядом, но ты не избранная.",
      "Так близко, что аж бесит."
    ],
    win: [
      "О, норм. Живём.",
      "Зашло. Не расслабляйся.",
      "Окей. Сегодня ты не мразь."
    ],
    big: [
      "ЕБАТЬ. КРУПНО.",
      "Красиво. Я в шоке.",
      "ВЫНОС. Ставь на чёрное (не ставь)."
    ],
    scatter: [
      "БОНУС. СУКА. ПОЕХАЛО.",
      "Опа. Вселенная дала слабину.",
      "Сейчас будет сундук и моральная травма."
    ],
  };
  const arr = pack[kind] || pack.lose;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pushHistory(spin) {
  if (!ui.slotHistory) return;
  const row = document.createElement("div");
  row.className = "item";
  const sym = (spin.symbols || []).map(s => SYMBOL_LABEL[s] || s).join(" · ");
  const badge = String(spin.kind || "—").toUpperCase();
  row.innerHTML = `
    <div class="item__main">
      <div class="item__title">${sym}</div>
      <div class="item__sub">+${spin.winCoins || 0} монет • +${spin.winXp || 0} xp</div>
    </div>
    <div class="badge2">${badge}</div>
  `;
  ui.slotHistory.prepend(row);
  while (ui.slotHistory.children.length > 6) ui.slotHistory.lastChild.remove();
}

/* Bonus overlay */
function ensureBonusOverlay() {
  let wrap = document.getElementById("bonusOverlay");
  if (wrap) return wrap;

  wrap = document.createElement("div");
  wrap.id = "bonusOverlay";
  wrap.style.position = "fixed";
  wrap.style.inset = "0";
  wrap.style.zIndex = "9999";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.background = "rgba(0,0,0,.55)";
  wrap.style.backdropFilter = "blur(6px)";
  wrap.hidden = true;

  wrap.innerHTML = `
    <div style="
      width: min(360px, 92vw);
      border-radius: 18px;
      background: #0b0b0b;
      border: 1px solid rgba(255,255,255,.10);
      box-shadow: 0 10px 40px rgba(0,0,0,.7);
      padding: 14px;
    ">
      <div style="font-weight:800; font-size:16px; margin-bottom:8px;">Бонус: сундук судьбы</div>
      <div id="bonusText" style="opacity:.85; font-size:13px; line-height:1.35; margin-bottom:12px;">
        Выбирай. Один норм. Остальные — позор.
      </div>
      <div style="display:flex; gap:10px;">
        <button id="chA" class="btn btn--secondary" style="flex:1;">A</button>
        <button id="chB" class="btn btn--secondary" style="flex:1;">B</button>
        <button id="chC" class="btn btn--secondary" style="flex:1;">C</button>
      </div>
      <div style="margin-top:10px; display:flex; justify-content:flex-end;">
        <button id="bonusClose" class="btn btn--secondary">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  return wrap;
}

function openBonusOverlay() {
  const wrap = ensureBonusOverlay();
  const text = wrap.querySelector("#bonusText");
  wrap.hidden = false;

  const pick = (name) => {
    const roll = Math.random();
    let msg;
    if (roll < 0.25) msg = `Сундук ${name}: ПУСТО. Ну ты и верила.`;
    else if (roll < 0.80) msg = `Сундук ${name}: НОРМ. Забрала и ушла.`;
    else msg = `Сундук ${name}: ЛЮТЫЙ ДРОП. ЕБАТЬ.`;

    if (text) text.textContent = msg;
    haptic("medium");
    setTimeout(() => { wrap.hidden = true; }, 1100);
  };

  safeClick(wrap.querySelector("#bonusClose"), () => wrap.hidden = true);
  safeClick(wrap.querySelector("#chA"), () => pick("A"));
  safeClick(wrap.querySelector("#chB"), () => pick("B"));
  safeClick(wrap.querySelector("#chC"), () => pick("C"));
}

/* Spin */
let spinningSlot = false;
let autoMode = localStorage.getItem("auto") === "1";

function setAuto(v) {
  autoMode = !!v;
  localStorage.setItem("auto", autoMode ? "1" : "0");
  safeToggle(ui.btnAuto, "btn--primary", autoMode);
  safeToggle(ui.btnAuto, "btn--secondary", !autoMode);
}

async function slotSpinOnce() {
  if (spinningSlot) return;
  spinningSlot = true;

  if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = true;
  if (ui.btnAuto) ui.btnAuto.disabled = true;

  try {
    const resp = await api("/api/spin", {});
    const spin = resp.spin || {};
    const prof = resp.profile;

    if (prof) { ME = prof; syncProfile(ME); }

    setReelTarget(reel0, spin.symbols?.[0] || "BAR", 3, 900);
    setReelTarget(reel1, spin.symbols?.[1] || "BELL", 4, 1080);
    setReelTarget(reel2, spin.symbols?.[2] || "SEVEN", 5, 1260);

    setTimeout(() => {
      normalizeReel(reel0, spin.symbols?.[0] || "BAR");
      normalizeReel(reel1, spin.symbols?.[1] || "BELL");
      normalizeReel(reel2, spin.symbols?.[2] || "SEVEN");

      setGlow(spin.kind || "lose");
      safeText(ui.slotComment, slotJoke(spin.kind || "lose"));
      pushHistory(spin);

      if (spin.bonus) openBonusOverlay();

      haptic(spin.kind === "big" ? "medium" : "light");

      if (autoMode) setTimeout(() => slotSpinOnce().catch(() => {}), 500);

    }, 1350);

  } catch (e) {
    toast(e.message || "Ошибка", "bad");
    safeText(ui.slotComment, e.message || "Ошибка");
  } finally {
    spinningSlot = false;
    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;
  }
}

safeClick(ui.btnSlotSpin, () => slotSpinOnce().catch(() => {}));
safeClick(ui.btnAuto, () => {
  setAuto(!autoMode);
  toast(autoMode ? "Авто: ON. Ну ты псих." : "Авто: OFF.", "info");
  if (autoMode) slotSpinOnce().catch(() => {});
});

/* Boot */
(function boot() {
  initTelegramUi();
  renderStaticText();
  showTab("slot"); // сразу в слот, чтобы кайфануть
  setAuto(autoMode);

  loadMe().catch(e => toast(e.message || "Ошибка", "bad"));
})();
