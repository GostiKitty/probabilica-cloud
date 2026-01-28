const tg = window.Telegram?.WebApp;

function initTelegramUi() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#0A0A0A");
    tg.setBackgroundColor?.("#0A0A0A");
    tg.enableClosingConfirmation?.();
  } catch {}
}

function initData() {
  return tg?.initData || "";
}

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

/* -------- i18n -------- */
const I18N = {
  ru: {
    coins: "Монеты",
    level: "Уровень",
    xp: "Опыт",
    friendCode: "Friend code",
    copy: "Скопировать",
    fight: "Fight",
    friends: "Friends",
    slot: "Slot",
    pve: "PvE",
    pvp: "PvP",
    add: "Add",
    challenge: "Challenge",
    accept: "Accept",
    slotSpin: "Spin",
    slotAuto: "Auto",
    free: "Free",
    meter: "Meter",
    history: "History",
  },
  en: {
    coins: "Coins",
    level: "Level",
    xp: "XP",
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
    slotSpin: "Spin",
    slotAuto: "Auto",
    free: "Free spins",
    meter: "Meter",
    history: "History",
  },
  cn: {
    coins: "金币",
    level: "等级",
    xp: "经验",
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
    slotSpin: "旋转",
    slotAuto: "自动",
    free: "免费旋转",
    meter: "进度",
    history: "记录",
  }
};

let LANG = localStorage.getItem("lang") || "ru";
if (!I18N[LANG]) LANG = "ru";

let spicy = localStorage.getItem("spicy") === "1";
function t(k) { return I18N[LANG][k] || I18N.ru[k] || k; }

/* -------- UI refs -------- */
const ui = {
  subtitle: document.getElementById("subtitle"),
  footerText: document.getElementById("footerText"),

  coins: document.getElementById("coins"),
  level: document.getElementById("level"),
  xp: document.getElementById("xp"),
  friendCode: document.getElementById("friendCode"),
  btnCopy: document.getElementById("btnCopy"),

  btnLang: document.getElementById("btnLang"),
  btnSpicy: document.getElementById("btnSpicy"),

  tabFight: document.getElementById("tabFight"),
  tabFriends: document.getElementById("tabFriends"),
  tabSlot: document.getElementById("tabSlot"),
  panels: [...document.querySelectorAll("[data-panel]")],

  ttlPve: document.getElementById("ttlPve"),
  ttlPvp: document.getElementById("ttlPvp"),
  ttlFriends: document.getElementById("ttlFriends"),
  ttlSlot: document.getElementById("ttlSlot"),
  ttlHistory: document.getElementById("ttlHistory"),

  lblCoins: document.getElementById("lblCoins"),
  lblLevel: document.getElementById("lblLevel"),
  lblXp: document.getElementById("lblXp"),
  lblFriendCode: document.getElementById("lblFriendCode"),

  btnPveFight: document.getElementById("btnPveFight"),
  btnPvpOpen: document.getElementById("btnPvpOpen"),
  btnRefreshDuels: document.getElementById("btnRefreshDuels"),
  hint: document.getElementById("hint"),

  enemyName: document.getElementById("enemyName"),
  enemyHp: document.getElementById("enemyHp"),

  friends: document.getElementById("friends"),
  friendInput: document.getElementById("friendInput"),
  btnAddFriend: document.getElementById("btnAddFriend"),

  duels: document.getElementById("duels"),
  pvpStatus: document.getElementById("pvpStatus"),

  freeSpins: document.getElementById("freeSpins"),
  meter: document.getElementById("meter"),
  lblFree: document.getElementById("lblFree"),
  lblMeter: document.getElementById("lblMeter"),

  reel0: document.getElementById("reel0"),
  reel1: document.getElementById("reel1"),
  reel2: document.getElementById("reel2"),
  payline: document.querySelector(".payline"),
  slotGlow: document.getElementById("slotGlow"),
  btnSlotSpin: document.getElementById("btnSlotSpin"),
  btnAuto: document.getElementById("btnAuto"),
  slotComment: document.getElementById("slotComment"),
  slotHistory: document.getElementById("slotHistory"),

  drop: document.getElementById("drop"),
  dropTitle: document.getElementById("dropTitle"),
  dropSub: document.getElementById("dropSub"),
};

function setHint(text) { ui.hint.textContent = text || ""; }

function haptic(kind = "light") {
  try { tg?.HapticFeedback?.impactOccurred?.(kind); } catch {}
}

/* -------- Tabs -------- */
function showTab(tab) {
  for (const b of [ui.tabFight, ui.tabFriends, ui.tabSlot]) {
    b.classList.toggle("is-active", b.dataset.tab === tab);
  }
  for (const p of ui.panels) p.hidden = p.dataset.panel !== tab;
  setHint("");
}
ui.tabFight.addEventListener("click", () => showTab("fight"));
ui.tabFriends.addEventListener("click", () => showTab("friends"));
ui.tabSlot.addEventListener("click", () => showTab("slot"));

/* -------- Static text -------- */
function renderStaticText() {
  ui.lblCoins.textContent = t("coins");
  ui.lblLevel.textContent = t("level");
  ui.lblXp.textContent = t("xp");
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
  ui.btnSlotSpin.textContent = t("slotSpin");
  ui.btnAuto.textContent = t("slotAuto");

  ui.lblFree.textContent = t("free");
  ui.lblMeter.textContent = t("meter");

  ui.btnLang.textContent = LANG.toUpperCase();
}
ui.btnLang.addEventListener("click", () => {
  LANG = LANG === "ru" ? "en" : LANG === "en" ? "cn" : "ru";
  localStorage.setItem("lang", LANG);
  renderStaticText();
});

/* -------- Copy friend code -------- */
ui.btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(ui.friendCode.textContent || "");
    haptic("light");
  } catch {}
});

/* -------- Spicy toggle -------- */
function renderSpicy() {
  ui.btnSpicy.textContent = spicy ? "On" : "Off";
  ui.btnSpicy.classList.toggle("btn--primary", spicy);
  ui.btnSpicy.classList.toggle("btn--secondary", !spicy);
}
renderSpicy();
ui.btnSpicy.addEventListener("click", () => {
  spicy = !spicy;
  localStorage.setItem("spicy", spicy ? "1" : "0");
  renderSpicy();
});

/* -------- Profile -------- */
let ME = null;

function setSlotMetaFromProfile(p) {
  ui.freeSpins.textContent = String(p?.free_spins ?? 0);
  ui.meter.textContent = String(p?.meter ?? 0);
}

async function loadMe() {
  const data = await api("/api/me");
  ME = data;
  ui.coins.textContent = String(ME.coins ?? 0);
  ui.level.textContent = String(ME.level ?? 1);
  ui.xp.textContent = String(ME.xp ?? 0);
  ui.friendCode.textContent = String(ME.user_id || "");
  setSlotMetaFromProfile(ME);
  ui.footerText.textContent = `id=${ME.user_id}`;
}

/* -------- Friends -------- */
async function loadFriends() {
  const data = await api("/api/friends");
  ui.friends.innerHTML = "";
  for (const f of data.friends || []) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${f.user_id}</div>
        <div class="item__sub">${f.username || ""}</div>
      </div>
      <button class="btn btn--secondary" data-action="challenge" data-id="${f.user_id}">${t("challenge")}</button>
    `;
    ui.friends.appendChild(row);
  }

  ui.friends.querySelectorAll('[data-action="challenge"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const to_id = Number(btn.dataset.id);
      try {
        await api("/api/duel_create", { to_id, stake: 25 });
        haptic("light");
        showTab("fight");
        await loadDuels();
      } catch (e) {
        setHint(e.message);
      }
    });
  });
}

ui.btnAddFriend.addEventListener("click", async () => {
  const friend_id = Number(ui.friendInput.value);
  if (!friend_id) return;
  try {
    await api("/api/friends", { friend_id });
    ui.friendInput.value = "";
    haptic("light");
    await loadFriends();
  } catch (e) {
    setHint(e.message);
  }
});

/* -------- Duels -------- */
async function loadDuels() {
  const data = await api("/api/duels");
  ui.duels.innerHTML = "";

  const list = data.duels || [];
  ui.pvpStatus.textContent = list.length ? `${list.length}` : "—";

  for (const d of list) {
    const row = document.createElement("div");
    row.className = "item";

    const title = `#${String(d.duel_id).slice(0, 6)} · stake ${d.stake}`;
    const sub = d.resolved ? `winner ${d.winner}` : `from ${d.from} → to ${d.to}`;

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      ${(!d.resolved && d.to === ME?.user_id)
        ? `<button class="btn btn--primary" data-action="accept" data-id="${d.duel_id}">${t("accept")}</button>`
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
      } catch (e) {
        setHint(e.message);
      }
    });
  });
}

ui.btnRefreshDuels.addEventListener("click", () => loadDuels().catch(()=>{}));

/* -------- PvE (визуально) -------- */
const ENEMIES = [
  { name: "ЭлектроДед", hp: 100 },
  { name: "График Без Оси", hp: 90 },
  { name: "Рандом без seed", hp: 80 },
];
let enemy = null;
let enemyHp = 100;

function pickEnemy() {
  enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  enemyHp = enemy.hp;
  ui.enemyName.textContent = enemy.name;
  ui.enemyHp.style.width = "100%";
}

ui.btnPveFight.addEventListener("click", () => {
  const dmg = 20 + Math.floor(Math.random() * 25);
  enemyHp = Math.max(0, enemyHp - dmg);
  ui.enemyHp.style.width = `${Math.floor((enemyHp / enemy.hp) * 100)}%`;

  if (enemyHp === 0) {
    setHint(spicy ? "Ты победила. И да, это было неизбежно." : "Победа.");
    pickEnemy();
    loadMe().catch(()=>{});
    haptic("medium");
    return;
  }
  setHint(spicy ? "Бей ещё. Он всё понял." : "Удар.");
  haptic("light");
});

/* -------- SLOT -------- */
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
  const repeats = 40;
  const rows = [];
  for (let i = 0; i < ORDER.length * repeats; i++) rows.push(ORDER[i % ORDER.length]);
  elStrip.innerHTML = rows.map(s => `<div class="sym sym--${s}"><span>${SYMBOL_LABEL[s]}</span></div>`).join("");
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

function normalizeReelPosition(elStrip, rows, finalSymbol) {
  const pick = randomIndexOfSymbol(rows, finalSymbol);
  const centerRow = 1;
  const base = (pick - centerRow) * REEL_ROW_H;
  const y = -base;

  elStrip.style.transition = "none";
  elStrip.style.transform = `translateY(${y}px)`;
  elStrip.getBoundingClientRect(); // reflow
}

function setReelTarget(elStrip, rows, symbol, extraTurns) {
  const pick = randomIndexOfSymbol(rows, symbol);
  const centerRow = 1;
  const base = (pick - centerRow) * REEL_ROW_H;
  const turns = extraTurns * rows.length * REEL_ROW_H;
  const y = -(base + turns);
  elStrip.style.transform = `translateY(${y}px)`;
}

function pushHistory(spin) {
  const row = document.createElement("div");
  row.className = "item";
  row.innerHTML = `
    <div class="item__main">
      <div class="item__title">${spin.symbols.join(" · ")}</div>
      <div class="item__sub">+${spin.winCoins} coins • +${spin.winXp} xp</div>
    </div>
    <div class="badge2">${spin.kind.toUpperCase()}</div>
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
    lose: ["Промах.", "Нет.", "Сухо."],
    near: ["Почти.", "Рядом.", "Мимо по этике."],
    win: ["Ок.", "Есть.", "Пойдёт."],
    big: ["Сочно.", "Красиво.", "Это было лишнее."],
    scatter: ["Бонус.", "Фриспины.", "Началось."],
    meter: ["Шкала закрыта.", "Фриспины.", "Включилось."],
  };
  const EN = {
    lose: ["No.", "Miss.", "Dry."],
    near: ["Close.", "Almost.", "So close."],
    win: ["Ok.", "Win.", "Nice."],
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
  const pack = LANG === "cn" ? CN : LANG === "en" ? EN : RU;
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

  const free = Number(ME?.free_spins ?? 0);
  if (free <= 0 && autoMode) {
    // авто выключаем, если фриспины кончились
    setAuto(false);
    return;
  }

  spinningSlot = true;
  ui.btnSlotSpin.disabled = true;
  ui.btnAuto.disabled = true;

  let resp;
  try {
    resp = await api("/api/spin", {});
  } catch (e) {
    ui.slotComment.textContent = e.message || "Error";
    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;
    return;
  }

  const spin = resp.spin;
  const prof = resp.profile;
  if (prof) {
    ME = prof;
    ui.coins.textContent = String(ME.coins ?? 0);
    ui.level.textContent = String(ME.level ?? 1);
    ui.xp.textContent = String(ME.xp ?? 0);
    ui.friendCode.textContent = String(ME.user_id || "");
    setSlotMetaFromProfile(ME);
  }

  // 1) normalize до анимации (без transition)
  normalizeReelPosition(ui.reel0, reelRows0, spin.symbols[0]);
  normalizeReelPosition(ui.reel1, reelRows1, spin.symbols[1]);
  normalizeReelPosition(ui.reel2, reelRows2, spin.symbols[2]);

  // 2) включаем transition
  ui.reel0.style.transition = "transform 900ms cubic-bezier(.12,.72,.11,1)";
  ui.reel1.style.transition = "transform 1050ms cubic-bezier(.12,.72,.11,1)";
  ui.reel2.style.transition = "transform 1200ms cubic-bezier(.12,.72,.11,1)";
  ui.reel0.getBoundingClientRect(); // reflow перед стартом

  // 3) крутим
  setReelTarget(ui.reel0, reelRows0, spin.symbols[0], 3);
  setReelTarget(ui.reel1, reelRows1, spin.symbols[1], 4);
  setReelTarget(ui.reel2, reelRows2, spin.symbols[2], 5);

  haptic("light");
  setTimeout(() => haptic("light"), 900);
  setTimeout(() => haptic("light"), 1050);
  setTimeout(() => haptic("medium"), 1200);

  setTimeout(() => {
    const kind = spin.meter_triggered ? "meter" : spin.kind;
    ui.slotComment.textContent = slotComment(kind);
    setGlow(spin.kind, spin.bonus_until);
    pushHistory(spin);

    if (spin.drop) {
      ui.drop.hidden = false;
      ui.dropTitle.textContent = spin.drop.title || "Drop";
      ui.dropSub.textContent = spin.drop.effect || "";
    } else {
      ui.drop.hidden = true;
    }

    // 4) normalize после анимации (чтобы transform не улетал в бесконечность)
    normalizeReelPosition(ui.reel0, reelRows0, spin.symbols[0]);
    normalizeReelPosition(ui.reel1, reelRows1, spin.symbols[1]);
    normalizeReelPosition(ui.reel2, reelRows2, spin.symbols[2]);

    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;

    const free2 = Number(ME?.free_spins ?? 0);
    if (autoMode && free2 > 0) setTimeout(() => slotSpinOnce(), 450);
  }, 1300);
}

ui.btnSlotSpin.addEventListener("click", () => slotSpinOnce());
ui.btnAuto.addEventListener("click", () => {
  setAuto(!autoMode);
  const free = Number(ME?.free_spins ?? 0);
  if (autoMode && free > 0 && !spinningSlot) slotSpinOnce();
});
setAuto(autoMode);

/* ----- Boot ----- */
(async function boot() {
  initTelegramUi();
  renderStaticText();
  renderSpicy();

  if (!initData()) {
    ui.subtitle.textContent = "Open in Telegram";
    setHint("Запусти мини-приложение из бота.");
    return;
  }

  try {
    pickEnemy();
    await loadMe();
    await loadFriends();
    await loadDuels();
  } catch (e) {
    setHint(e.message || "Ошибка");
  }
})();
