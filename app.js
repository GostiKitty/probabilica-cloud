/* Probabilica app.js (frontend) */

function el(id) { return document.getElementById(id); }
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
  panels: Array.from(document.querySelectorAll("[data-panel]")),

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

  // fight
  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),
  enemyCard: el("enemyCard"),
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyHp: el("enemyHp"),
  stakes: Array.from(document.querySelectorAll(".stake")),

  // friends
  friends: el("friends"),
  friendInput: el("friendInput"),
  btnAddFriend: el("btnAddFriend"),

  // pvp
  duels: el("duels"),
  pvpToId: el("pvpToId"),
  pvpStake: el("pvpStake"),
  btnCreateDuel: el("btnCreateDuel"),
  duelLog: el("duelLog"),
  btnRefreshDuels: el("btnRefreshDuels"),
  pvpStatus: el("pvpStatus"),

  // slot
  freeSpins: el("freeSpins"),
  meter: el("meter"),
  lblFree: el("lblFree"),
  lblMeter: el("lblMeter"),

  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  payline: document.querySelector(".payline"),
  slotGlow: el("slotGlow"),
  btnSlotSpin: el("btnSlotSpin"),
  btnAuto: el("btnAuto"),
  slotComment: el("slotComment"),
  slotHistory: el("slotHistory"),

  drop: el("drop"),
  dropTitle: el("dropTitle"),
  dropSub: el("dropSub"),

  hint: el("hint"),
  toast: el("toast"),
};

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
    setTimeout(() => { ui.toast.hidden = true; }, 220);
  }, 1400);
}

function setHint(msg) {
  if (ui.hint) ui.hint.textContent = msg || "";
}

/* --- Telegram --- */
function tg() { return window.Telegram?.WebApp; }

function initTelegramUi() {
  const t = tg();
  if (!t) return;
  try {
    t.ready();
    t.expand();
    t.setHeaderColor?.("#0A0A0A");
    t.setBackgroundColor?.("#0A0A0A");
  } catch {}
}

function initData() {
  return tg()?.initData || "";
}

function haptic(type = "light") {
  try { tg()?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

/* --- API --- */
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

  if (!res.ok) {
    const msg = data?.detail || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* --- i18n + spicy jokes --- */
const I18N = {
  ru: {
    lobby: "Лобби",
    coins: "Монеты",
    level: "Уровень",
    xp: "Опыт",
    glory: "Glory",
    friendCode: "Friend code",
    copy: "Скопировать",

    fight: "Fight",
    friends: "Friends",
    slot: "Slot",

    pve: "PvE",
    pvp: "PvP",
    add: "Добавить",
    challenge: "Вызвать",
    accept: "Принять",

    free: "Фриспины",
    meter: "Шкала",
    history: "History",

    // buttons (clean)
    pveBtn: "Fight",
    pvpBtn: "Challenge",
    slotSpin: "Крутить",
    slotAuto: "Авто",
  },
  en: {
    lobby: "Lobby",
    coins: "Coins",
    level: "Level",
    xp: "XP",
    glory: "Glory",
    friendCode: "Friend code",
    copy: "Copy",

    fight: "Fight",
    friends: "Friends",
    slot: "Slot",

    pve: "PvE",
    pvp: "PvP",
    add: "Add",
    challenge: "Challenge",
    accept: "Accept",

    free: "Free spins",
    meter: "Meter",
    history: "History",

    pveBtn: "Fight",
    pvpBtn: "Challenge",
    slotSpin: "Spin",
    slotAuto: "Auto",
  },
  cn: {
    lobby: "大厅",
    coins: "金币",
    level: "等级",
    xp: "经验",
    glory: "Glory",
    friendCode: "Friend code",
    copy: "复制",

    fight: "战斗",
    friends: "好友",
    slot: "老虎机",

    pve: "PvE",
    pvp: "PvP",
    add: "添加",
    challenge: "挑战",
    accept: "接受",

    free: "免费",
    meter: "进度",
    history: "记录",

    pveBtn: "开打",
    pvpBtn: "挑战",
    slotSpin: "旋转",
    slotAuto: "自动",
  },
};

let LANG = localStorage.getItem("lang") || "ru";
let spicy = localStorage.getItem("spicy") === "1";

function t(key) { return (I18N[LANG] && I18N[LANG][key]) || key; }

function applyTopButtons() {
  ui.btnLang.textContent = LANG.toUpperCase();
  ui.btnSpicy.textContent = spicy ? "On" : "Off";
}

function renderStaticText() {
  ui.subtitle.textContent = t("lobby");
  ui.lblCoins.textContent = t("coins");
  ui.lblLevel.textContent = t("level");
  ui.lblXp.textContent = t("xp");
  ui.lblGlory.textContent = t("glory");
  ui.lblFriendCode.textContent = t("friendCode");
  ui.btnCopy.textContent = t("copy");

  ui.tabFight.textContent = t("fight");
  ui.tabFriends.textContent = t("friends");
  ui.tabSlot.textContent = t("slot");

  ui.ttlPve.textContent = t("pve");
  ui.ttlPvp.textContent = t("pvp");
  ui.ttlFriends.textContent = t("friends");
  ui.ttlSlot.textContent = t("slot");
  ui.ttlHistory.textContent = t("history");

  ui.btnAddFriend.textContent = t("add");

  // кнопки с юмором (spicy включается отдельно)
  ui.btnPveFight.textContent = spicy
    ? (LANG === "ru" ? "Ебнуть" : LANG === "cn" ? "狠狠干" : "Send it")
    : t("pveBtn");

  ui.btnCreateDuel.textContent = spicy
    ? (LANG === "ru" ? "Вызвать на разбор" : LANG === "cn" ? "约架" : "Call out")
    : t("challenge");

  ui.btnSlotSpin.textContent = spicy
    ? (LANG === "ru" ? "КРУТИ, НЕ ОЧКУЙ" : LANG === "cn" ? "转！" : "Spin. Don’t blink.")
    : t("slotSpin");

  ui.btnAuto.textContent = spicy
    ? (LANG === "ru" ? "Авто (опасно)" : LANG === "cn" ? "自动" : "Auto")
    : t("slotAuto");

  ui.lblFree.textContent = t("free");
  ui.lblMeter.textContent = t("meter");
}

ui.btnLang.addEventListener("click", () => {
  const order = ["ru", "en", "cn"];
  const i = order.indexOf(LANG);
  LANG = order[(i + 1) % order.length];
  localStorage.setItem("lang", LANG);
  applyTopButtons();
  renderStaticText();
  toast(LANG === "ru" ? "Язык." : LANG === "cn" ? "语言。" : "Language.");
});

ui.btnSpicy.addEventListener("click", () => {
  spicy = !spicy;
  localStorage.setItem("spicy", spicy ? "1" : "0");
  applyTopButtons();
  renderStaticText();
  toast(spicy ? "Spicy: ON" : "Spicy: OFF");
});

/* --- Tabs --- */
function showTab(name) {
  ui.panels.forEach(p => p.hidden = (p.dataset.panel !== name));
  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(b => b.classList.remove("is-active"));
  if (name === "fight") ui.tabFight.classList.add("is-active");
  if (name === "friends") ui.tabFriends.classList.add("is-active");
  if (name === "slot") ui.tabSlot.classList.add("is-active");
  setHint("");
}
ui.tabFight.addEventListener("click", () => showTab("fight"));
ui.tabFriends.addEventListener("click", () => showTab("friends"));
ui.tabSlot.addEventListener("click", () => showTab("slot"));

/* --- Profile --- */
let ME = null;
let currentStake = 25;

function syncProfileToUI(p) {
  ui.coins.textContent = String(p?.coins ?? 0);
  ui.level.textContent = String(p?.level ?? 1);
  ui.xp.textContent = String(p?.xp ?? 0);
  ui.glory.textContent = String(p?.glory ?? 0);
  ui.friendCode.textContent = String(p?.user_id ?? "0");

  ui.freeSpins.textContent = String(p?.free_spins ?? 0);
  ui.meter.textContent = String(p?.meter ?? 0);
}

async function loadMe() {
  const r = await api("/api/me");
  ME = r.profile;
  syncProfileToUI(ME);
}

/* --- Copy friend code --- */
ui.btnCopy.addEventListener("click", async () => {
  const code = (ui.friendCode.textContent || "").trim();
  try {
    await navigator.clipboard.writeText(code);
    toast(LANG === "ru" ? "Скопировано." : LANG === "cn" ? "已复制。" : "Copied.");
  } catch {
    toast(LANG === "ru" ? "Не скопировалось." : LANG === "cn" ? "复制失败。" : "Copy failed.", "bad");
  }
});

/* --- PvE (визуально; сервер-авторитетность оставляем на эндпоинт pve.js, если он у тебя уже есть) --- */
const ENEMIES = [
  { name: "ЭлектроДед", sub: "шепчет про ГОСТ и боль", hp: 100 },
  { name: "Рандом без seed", sub: "смотрит так, будто ты всё сломаешь", hp: 90 },
  { name: "График без оси", sub: "ничего не объясняет, но осуждает", hp: 80 },
];

let enemy = null;
let enemyHp = 100;

function pickEnemy() {
  enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  enemyHp = enemy.hp;
  ui.enemyName.textContent = enemy.name;
  ui.enemySub.textContent = spicy && LANG === "ru"
    ? `${enemy.sub}. (и да, он охуел)`
    : enemy.sub;
  ui.enemyHp.style.width = "100%";
}

ui.stakes.forEach(b => {
  b.addEventListener("click", () => {
    currentStake = Number(b.dataset.stake);
    ui.stakes.forEach(x => x.classList.toggle("btn--primary", x === b));
    ui.stakes.forEach(x => x.classList.toggle("btn--secondary", x !== b));
  });
});
if (ui.stakes[1]) ui.stakes[1].click();

ui.btnPveFight.addEventListener("click", async () => {
  // ВАЖНО: здесь только визуал. Если у тебя есть серверный /api/pve — мы подключим в следующем шаге.
  const dmg = 18 + Math.floor(Math.random() * 28);
  enemyHp = Math.max(0, enemyHp - dmg);
  ui.enemyHp.style.width = `${Math.floor((enemyHp / enemy.hp) * 100)}%`;

  if (enemyHp === 0) {
    ui.fightLog.textContent = spicy && LANG === "ru"
      ? "Победа. Он ушёл. Ты осталась с последствиями."
      : (LANG === "cn" ? "赢了。" : LANG === "en" ? "Win." : "Победа.");
    haptic("medium");
    pickEnemy();
    return;
  }

  ui.fightLog.textContent = spicy && LANG === "ru"
    ? "Удар. Он понял, но делает вид, что нет."
    : (LANG === "cn" ? "命中。" : LANG === "en" ? "Hit." : "Удар.");
  haptic("light");
});

/* --- Friends --- */
async function loadFriends() {
  const r = await api("/api/friends");
  ui.friends.innerHTML = "";
  const list = r.friends || [];

  if (!list.length) {
    ui.friends.innerHTML = `<div class="result">${LANG === "ru" ? "Пока пусто." : LANG === "cn" ? "暂无。" : "Empty."}</div>`;
    return;
  }

  for (const f of list) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${f.user_id ?? f}</div>
        <div class="item__sub">${f.username || ""}</div>
      </div>
    `;
    ui.friends.appendChild(row);
  }
}

ui.btnAddFriend.addEventListener("click", async () => {
  const friend_id = Number((ui.friendInput.value || "").trim());
  if (!friend_id) return;

  ui.btnAddFriend.disabled = true;
  try {
    await api("/api/friends", { friend_id });
    ui.friendInput.value = "";
    haptic("light");
    await loadFriends();
    toast(LANG === "ru" ? "Добавлено." : LANG === "cn" ? "已添加。" : "Added.");
  } catch (e) {
    toast(e.message || "Error", "bad");
  } finally {
    ui.btnAddFriend.disabled = false;
  }
});

/* --- Duels --- */
async function loadDuels() {
  const r = await api("/api/duels");
  const list = r.duels || [];
  ui.duels.innerHTML = "";
  ui.pvpStatus.textContent = list.length ? String(list.length) : "—";

  for (const d of list) {
    const row = document.createElement("div");
    row.className = "item";

    const title = `#${String(d.duel_id).slice(0, 6)} · stake ${d.stake}`;
    const sub = d.resolved ? `winner ${d.winner}` : `from ${d.from} → to ${d.to}`;

    const canAccept = (!d.resolved && d.to === ME?.user_id);
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      ${
        canAccept
          ? `<button class="btn btn--primary" data-action="accept" data-id="${d.duel_id}">${spicy && LANG==="ru" ? "Принять и охуеть" : t("accept")}</button>`
          : `<div class="badge2">${d.resolved ? "RESOLVED" : "OPEN"}</div>`
      }
    `;

    ui.duels.appendChild(row);
  }

  ui.duels.querySelectorAll('[data-action="accept"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const duel_id = btn.dataset.id;
      try {
        await api("/api/duel_resolve", { duel_id });
        haptic("medium");
        await loadMe();
        await loadDuels();
        toast(spicy && LANG==="ru" ? "Разбор завершён." : "OK", "win");
      } catch (e) {
        toast(e.message || "Error", "bad");
      }
    });
  });
}

ui.btnRefreshDuels.addEventListener("click", () => loadDuels().catch(() => {}));

ui.btnCreateDuel.addEventListener("click", async () => {
  const to_id = Number((ui.pvpToId.value || "").trim());
  const stake = Number(ui.pvpStake.value || 25);
  if (!to_id) return;

  ui.btnCreateDuel.disabled = true;
  ui.duelLog.textContent = spicy && LANG === "ru" ? "Оформляем разбор..." : "Creating...";
  try {
    await api("/api/duel_create", { to_id, stake });
    haptic("light");
    ui.duelLog.textContent = spicy && LANG === "ru" ? "Вызов отправлен. Ждём реакцию." : "Sent.";
    await loadDuels();
  } catch (e) {
    ui.duelLog.textContent = e.message || "Error";
  } finally {
    ui.btnCreateDuel.disabled = false;
  }
});

/* --- SLOT --- */
const SYMBOL_LABEL = {
  BAR: "BAR",
  BELL: "BELL",
  SEVEN: "7",
  CHERRY: "CH",
  STAR: "★",
  COIN: "¢",
  SCATTER: "S",
};

const REEL_ROW_H = 50;
const ORDER = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];

function buildReelStrip(elStrip) {
  // длинный стрип, чтобы "обороты" не улетали в пустоту
  const repeats = 40; // 7*40 = 280 рядов
  const rows = [];
  for (let i = 0; i < ORDER.length * repeats; i++) rows.push(ORDER[i % ORDER.length]);

  elStrip.innerHTML = rows
    .map(s => `<div class="sym sym--${s}"><span>${SYMBOL_LABEL[s]}</span></div>`)
    .join("");

  return rows;
}

const reelRows0 = buildReelStrip(ui.reel0);
const reelRows1 = buildReelStrip(ui.reel1);
const reelRows2 = buildReelStrip(ui.reel2);

function randomIndexOfSymbol(rows, symbol) {
  const idxs = [];
  for (let i = 0; i < rows.length; i++) if (rows[i] === symbol) idxs.push(i);
  return idxs[Math.floor(Math.random() * idxs.length)];
}

function setReelTarget(elStrip, rows, symbol, extraTurns) {
  const pick = randomIndexOfSymbol(rows, symbol);
  const centerRow = 1; // средний видимый ряд
  const base = (pick - centerRow) * REEL_ROW_H;
  const turns = extraTurns * rows.length * REEL_ROW_H;
  const y = -(base + turns);
  elStrip.style.transform = `translateY(${y}px)`;
}

function normalizeReelPosition(elStrip, rows, finalSymbol) {
  // после остановки возвращаем в "короткую" позицию, чтобы дальше крутить снова нормально
  const pick = randomIndexOfSymbol(rows, finalSymbol);
  const centerRow = 1;
  const base = (pick - centerRow) * REEL_ROW_H;
  const y = -base;

  elStrip.style.transition = "none";
  elStrip.style.transform = `translateY(${y}px)`;
  elStrip.getBoundingClientRect(); // reflow
}

function pushHistory(spin) {
  const row = document.createElement("div");
  row.className = "item";
  const sym = (spin.symbols || []).join(" · ");
  const badge = String(spin.kind || "—").toUpperCase();
  row.innerHTML = `
    <div class="item__main">
      <div class="item__title">${sym}</div>
      <div class="item__sub">+${spin.winCoins} coins • +${spin.winXp} xp</div>
    </div>
    <div class="badge2">${badge}</div>
  `;
  ui.slotHistory.prepend(row);
  while (ui.slotHistory.children.length > 6) ui.slotHistory.lastChild.remove();
}

function setGlow(kind, bonusUntil) {
  ui.slotGlow.classList.remove("is-win","is-big","is-bonus");
  if (kind === "win" || kind === "near") ui.slotGlow.classList.add("is-win");
  if (kind === "big") ui.slotGlow.classList.add("is-big");
  if (kind === "scatter") ui.slotGlow.classList.add("is-bonus");
  if (bonusUntil && bonusUntil > Date.now()) ui.slotGlow.classList.add("is-bonus");

  ui.payline?.classList.toggle("is-hit", kind === "win" || kind === "big" || kind === "scatter");
  if (kind === "near") ui.payline?.classList.remove("is-hit");
}

function slotComment(kind) {
  const RU = {
    lose: spicy ? ["Мимо. Ноль. Сухо.", "Система тебя узнала.", "Сегодня без чудес."] : ["Мимо.", "Не сегодня.", "Сухо."],
    near: spicy ? ["Ну блядь, почти.", "Обидно до злости.", "Так близко, что больно."] : ["Почти.", "Обидно.", "Рядом."],
    win: spicy ? ["Норм. Дальше.", "Окей, ты не пустая.", "Зашло."] : ["Норм.", "Окей.", "Хорошо."],
    big: spicy ? ["Вот это разговор.", "Красиво. Без вопросов.", "Жёстко."] : ["Крупно.", "Сильно.", "Отлично."],
    scatter: spicy ? ["Бонус. Держи фриспины.", "Система моргнула — тебе повезло.", "О, началось."] : ["Бонус.", "Фриспины.", "Началось."],
    meter: spicy ? ["Шкала закрыта. Держи free и не выёбывайся.", "Ну всё, поехали.", "Ладно, заслужила."] : ["Шкала закрыта.", "Фриспины.", "Поехали."],
  };
  const EN = {
    lose: ["No.", "Miss.", "Dry."],
    near: ["So close.", "That hurt.", "Almost."],
    win: ["Ok.", "Nice.", "Good."],
    big: ["Big.", "Clean.", "That’s a moment."],
    scatter: ["Bonus.", "Free spins.", "Go."],
    meter: ["Meter popped.", "Free spins.", "Good."],
  };
  const CN = {
    lose: ["没关系。", "不急。", "今天不行。"],
    near: ["差一点。", "就差一点。", "太近了。"],
    win: ["还行。", "不错。", "可以。"],
    big: ["很猛。", "漂亮。", "大赢。"],
    scatter: ["进奖励。", "免费旋转。", "开始了。"],
    meter: ["进度满了。", "给你免费。", "走起。"],
  };

  const pack = LANG === "cn" ? CN : (LANG === "en" ? EN : RU);
  const arr = pack[kind] || pack.lose;
  return arr[Math.floor(Math.random() * arr.length)];
}

let spinningSlot = false;
let autoMode = localStorage.getItem("auto") === "1";

function setAuto(v) {
  autoMode = !!v;
  localStorage.setItem("auto", autoMode ? "1" : "0");
  ui.btnAuto.classList.toggle("btn--primary", autoMode);
  ui.btnAuto.classList.toggle("btn--secondary", !autoMode);
}

async function slotSpinOnce() {
  if (spinningSlot) return;
  spinningSlot = true;

  ui.btnSlotSpin.disabled = true;
  ui.btnAuto.disabled = true;

  // initData check (чтобы не было "тихо")
  if (!initData()) {
    ui.slotComment.textContent = "Open in Telegram (no initData).";
    toast("No initData. Открой в Telegram.", "bad");
    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;
    return;
  }

  let resp;
  try {
    resp = await api("/api/spin", {});
  } catch (e) {
    ui.slotComment.textContent = e.message || "Error";
    toast(e.message || "Error", "bad");
    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;
    return;
  }

  const spin = resp.spin;
  const prof = resp.profile;
  if (prof) {
    ME = prof;
    syncProfileToUI(ME);
  }

  // анимация
  haptic("light");

  ui.reel0.style.transition = "transform 900ms cubic-bezier(.12,72,11,1)";
  ui.reel1.style.transition = "transform 1050ms cubic-bezier(.12,72,11,1)";
  ui.reel2.style.transition = "transform 1200ms cubic-bezier(.12,72,11,1)";

  setReelTarget(ui.reel0, reelRows0, spin.symbols[0], 3);
  setReelTarget(ui.reel1, reelRows1, spin.symbols[1], 4);
  setReelTarget(ui.reel2, reelRows2, spin.symbols[2], 5);

  setTimeout(() => haptic("light"), 900);
  setTimeout(() => haptic("light"), 1050);
  setTimeout(() => haptic("medium"), 1200);

  // финал (после остановки)
  setTimeout(() => {
    // нормализуем позиции, чтобы следующий спин был нормальный
    normalizeReelPosition(ui.reel0, reelRows0, spin.symbols[0]);
    normalizeReelPosition(ui.reel1, reelRows1, spin.symbols[1]);
    normalizeReelPosition(ui.reel2, reelRows2, spin.symbols[2]);

    const kind = spin.meter_triggered ? "meter" : spin.kind;
    ui.slotComment.textContent = slotComment(kind);

    setGlow(spin.kind, spin.bonus_until);

    if (spin.drop) {
      ui.drop.hidden = false;
      ui.dropTitle.textContent = spin.drop.title || "Drop";
      ui.dropSub.textContent = spicy && LANG === "ru"
        ? "Подобрала. Не задавай вопросов."
        : (LANG === "cn" ? "获得。" : "Got it.");
    } else {
      ui.drop.hidden = true;
    }

    pushHistory(spin);

    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;

    if (autoMode) {
      const delay = 450 + Math.floor(Math.random() * 250);
      setTimeout(() => slotSpinOnce().catch(()=>{}), delay);
    }
  }, 1350);
}

ui.btnSlotSpin.addEventListener("click", () => slotSpinOnce().catch(()=>{}));
ui.btnAuto.addEventListener("click", () => {
  setAuto(!autoMode);
  toast(autoMode ? "Auto: ON" : "Auto: OFF");
  if (autoMode) slotSpinOnce().catch(()=>{});
});

/* --- Boot --- */
applyTopButtons();
renderStaticText();
initTelegramUi();
pickEnemy();
setAuto(autoMode);

Promise.resolve()
  .then(() => loadMe())
  .then(() => loadFriends().catch(()=>{}))
  .then(() => loadDuels().catch(()=>{}))
  .catch(e => {
    setHint(e.message || "Error");
    toast(e.message || "Error", "bad");
  });
