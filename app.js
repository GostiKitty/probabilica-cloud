const tg = window.Telegram?.WebApp;

/* -------- Telegram UI -------- */
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
function haptic(type) {
  try { tg?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

/* -------- API -------- */
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
    lobby: "Лобби",
    coins: "Монеты",
    level: "Уровень",
    xp: "Опыт",
    glory: "Glory",
    friendCode: "Friend code",
    copy: "Скопировать",
    fight: "Бой",
    friends: "Друзья",
    slot: "Слот",
    pve: "PvE",
    pvp: "PvP",
    add: "Добавить",
    duels: "Дуэли",
    challenge: "Вызвать",
    accept: "Принять",
    slotSpin: "Крутить",
    slotAuto: "Авто",
    free: "Фриспины",
    meter: "Шкала",
    history: "История",
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
    duels: "Duels",
    challenge: "Challenge",
    accept: "Accept",
    slotSpin: "Spin",
    slotAuto: "Auto",
    free: "Free spins",
    meter: "Meter",
    history: "History",
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
    duels: "对决",
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

let spicy = localStorage.getItem("spicy") !== "0"; // по умолчанию да
function t(k) { return I18N[LANG][k] || I18N.ru[k] || k; }

/* -------- UI refs -------- */
const ui = {
  subtitle: document.getElementById("subtitle"),

  coins: document.getElementById("coins"),
  level: document.getElementById("level"),
  xp: document.getElementById("xp"),
  glory: document.getElementById("glory"),
  friendCode: document.getElementById("friendCode"),
  btnCopy: document.getElementById("btnCopy"),

  btnLang: document.getElementById("btnLang"),
  btnSpicy: document.getElementById("btnSpicy"),

  tabFight: document.getElementById("tabFight"),
  tabFriends: document.getElementById("tabFriends"),
  tabSlot: document.getElementById("tabSlot"),

  panels: Array.from(document.querySelectorAll("[data-panel]")),

  ttlPve: document.getElementById("ttlPve"),
  ttlPvp: document.getElementById("ttlPvp"),
  ttlFriends: document.getElementById("ttlFriends"),
  ttlSlot: document.getElementById("ttlSlot"),
  ttlHistory: document.getElementById("ttlHistory"),

  lblCoins: document.getElementById("lblCoins"),
  lblLevel: document.getElementById("lblLevel"),
  lblXp: document.getElementById("lblXp"),
  lblGlory: document.getElementById("lblGlory"),
  lblFriendCode: document.getElementById("lblFriendCode"),

  btnPveFight: document.getElementById("btnPveFight"),
  fightLog: document.getElementById("fightLog"),

  enemyCard: document.getElementById("enemyCard"),
  enemyName: document.getElementById("enemyName"),
  enemySub: document.getElementById("enemySub"),
  enemyHp: document.getElementById("enemyHp"),

  friends: document.getElementById("friends"),
  friendInput: document.getElementById("friendInput"),
  btnAddFriend: document.getElementById("btnAddFriend"),

  duels: document.getElementById("duels"),
  pvpToId: document.getElementById("pvpToId"),
  pvpStake: document.getElementById("pvpStake"),
  btnCreateDuel: document.getElementById("btnCreateDuel"),
  duelLog: document.getElementById("duelLog"),
  btnRefreshDuels: document.getElementById("btnRefreshDuels"),
  btnPvpOpen: document.getElementById("btnPvpOpen"),
  pvpStatus: document.getElementById("pvpStatus"),

  // slot
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

  hint: document.getElementById("hint"),
};

function setHint(text) {
  if (!ui.hint) return;
  ui.hint.textContent = text || "";
}

/* -------- Tabs -------- */
function showTab(name) {
  ui.panels.forEach(p => p.hidden = (p.dataset.panel !== name));
  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(btn => btn.classList.remove("is-active"));
  if (name === "fight") ui.tabFight.classList.add("is-active");
  if (name === "friends") ui.tabFriends.classList.add("is-active");
  if (name === "slot") ui.tabSlot.classList.add("is-active");
}
ui.tabFight.addEventListener("click", () => showTab("fight"));
ui.tabFriends.addEventListener("click", () => showTab("friends"));
ui.tabSlot.addEventListener("click", () => showTab("slot"));

/* -------- Language + spicy -------- */
function renderStaticText() {
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

  ui.lblFree.textContent = t("free");
  ui.lblMeter.textContent = t("meter");

  ui.btnAddFriend.textContent = t("add");
  ui.btnCreateDuel.textContent = t("challenge");
  ui.btnRefreshDuels.textContent = "Refresh";

  ui.btnLang.textContent = LANG.toUpperCase();
  ui.btnSpicy.textContent = spicy ? "On" : "Off";

  ui.btnPveFight.textContent = fightButtonLabel();
}

function fightButtonLabel() {
  if (LANG === "cn") return spicy ? "动手" : "战斗";
  if (LANG === "en") return spicy ? "Proceed." : "Fight";
  // ru
  return spicy ? "Жми." : "Бой";
}

ui.btnLang.addEventListener("click", () => {
  LANG = (LANG === "ru") ? "en" : (LANG === "en") ? "cn" : "ru";
  localStorage.setItem("lang", LANG);
  renderStaticText();
  // перерисуем enemy sub
  if (enemy) renderEnemy(enemy);
});

ui.btnSpicy.addEventListener("click", () => {
  spicy = !spicy;
  localStorage.setItem("spicy", spicy ? "1" : "0");
  renderStaticText();
});

ui.btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(String(ME?.user_id || ""));
    haptic("light");
    setHint(LANG === "cn" ? "复制了。" : LANG === "en" ? "Copied." : "Скопировано.");
    setTimeout(() => setHint(""), 900);
  } catch {
    setHint("Copy failed");
  }
});

/* -------- Profile -------- */
let ME = null;

function setSlotMetaFromProfile(p) {
  ui.freeSpins.textContent = String(p.free_spins ?? 0);
  ui.meter.textContent = String(p.meter ?? 0);
}

async function loadMe() {
  const p = await api("/api/me");
  ME = p;
  ui.coins.textContent = String(ME.coins ?? 0);
  ui.level.textContent = String(ME.level ?? 1);
  ui.xp.textContent = String(ME.xp ?? 0);
  ui.glory.textContent = String(ME.glory ?? 0);
  ui.friendCode.textContent = String(ME.user_id || "");
  setSlotMetaFromProfile(ME);

  // remove skeleton class if any (safe)
  [ui.coins, ui.level, ui.xp].forEach(el => el?.classList?.remove?.("skeleton"));
}

/* -------- Friends -------- */
async function loadFriends() {
  const r = await api("/api/friends");
  const ids = r.friends || [];
  ui.friends.innerHTML = "";

  if (!ids.length) {
    ui.friends.innerHTML = `<div class="result">${LANG === "cn" ? "还没有好友。" : LANG === "en" ? "No friends yet." : "Пока пусто. Добавь друга по friend id."}</div>`;
    return;
  }

  for (const id of ids) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${id}</div>
        <div class="item__sub">${LANG === "cn" ? "好友" : "friend"}</div>
      </div>
      <button class="mini-btn duelBtn">${t("challenge")}</button>
    `;
    row.querySelector(".duelBtn").addEventListener("click", () => {
      ui.pvpToId.value = String(id);
      showTab("fight");
      ui.duelLog.textContent = "";
      haptic("light");
    });
    ui.friends.appendChild(row);
  }
}

ui.btnAddFriend.addEventListener("click", async () => {
  const friend_id = ui.friendInput.value.trim();
  if (!friend_id) return;

  ui.btnAddFriend.disabled = true;
  try {
    await api("/api/friends", { friend_id });
    ui.friendInput.value = "";
    haptic("light");
    await loadFriends();
    setHint(LANG === "cn" ? "完成。" : LANG === "en" ? "Done." : "Готово.");
    setTimeout(() => setHint(""), 900);
  } catch (e) {
    setHint(e.message || "Error");
  } finally {
    ui.btnAddFriend.disabled = false;
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
    const sub = d.resolved
      ? `winner ${d.winner}`
      : `from ${d.from} → to ${d.to}`;

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

ui.btnCreateDuel.addEventListener("click", async () => {
  const to_id = ui.pvpToId.value.trim();
  const stake = Number(ui.pvpStake.value);
  if (!to_id) return;

  ui.btnCreateDuel.disabled = true;
  ui.duelLog.textContent = LANG === "cn" ? "创建挑战…" : LANG === "en" ? "Creating…" : "Создаю вызов…";
  try {
    const r = await api("/api/duel_create", { to_id: Number(to_id), stake });
    ui.duelLog.textContent = `${LANG === "cn" ? "已创建" : LANG === "en" ? "Created" : "Вызов создан"}: ${r.duel.duel_id}`;
    haptic("light");
    await loadDuels();
  } catch (e) {
    ui.duelLog.textContent = e.message || "Error";
  } finally {
    ui.btnCreateDuel.disabled = false;
  }
});

/* -------- PvE (server-authoritative) -------- */
let currentStake = 25;

const FRONT_ENEMIES = [
  { id: "electro_ded", ru: "ЭлектроДед", cn: "电爷", en: "Electro Grandpa", sub_ru: "Пахнет озоном и самоуверенностью.", sub_en: "Smells like ozone and confidence.", sub_cn: "一股自信的臭氧味。"},
  { id: "axisless_graph", ru: "График Без Оси", cn: "没坐标的图", en: "Axisless Graph", sub_ru: "Пугает преподавателей.", sub_en: "Terrifies instructors.", sub_cn: "老师看了沉默。"},
  { id: "seedless_rng", ru: "Рандом без seed", cn: "无种随机", en: "Seedless RNG", sub_ru: "Нечестный, но официальный.", sub_en: "Unfair, yet official.", sub_cn: "不讲道理但合规。"},
  { id: "latex_error", ru: "Синтаксис в LaTeX", cn: "LaTeX 报错", en: "LaTeX Error", sub_ru: "Съедает время.", sub_en: "Consumes time.", sub_cn: "吞时间。"},
  { id: "deadline", ru: "Дедлайн", cn: "截止日期", en: "Deadline", sub_ru: "Он всегда быстрее.", sub_en: "Always faster than you.", sub_cn: "永远更快。"},
];

let enemy = FRONT_ENEMIES[Math.floor(Math.random() * FRONT_ENEMIES.length)];
let enemyHpPct = 100;

function renderEnemy(e) {
  const name = (LANG === "cn") ? e.cn : (LANG === "en") ? e.en : e.ru;
  const sub = (LANG === "cn") ? e.sub_cn : (LANG === "en") ? e.sub_en : e.sub_ru;
  ui.enemyName.textContent = name;
  ui.enemySub.textContent = sub;
}

function pickEnemy() {
  enemy = FRONT_ENEMIES[Math.floor(Math.random() * FRONT_ENEMIES.length)];
  enemyHpPct = 100;
  renderEnemy(enemy);
  ui.enemyHp.style.width = "100%";
}

document.querySelectorAll(".stake").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".stake").forEach(b => b.classList.remove("btn--primary"));
    btn.classList.add("btn--primary");
    currentStake = Number(btn.dataset.stake || 25);
    haptic("light");
  });
});

// выбрать 25 по умолчанию
document.querySelectorAll(".stake").forEach(btn => {
  if (btn.dataset.stake === "25") btn.classList.add("btn--primary");
});

function fightLine(result) {
  // коротко, стильно, локальный юмор
  if (!result.win) {
    if (LANG === "cn") return spicy ? "你被教育了。" : "失败。";
    if (LANG === "en") return spicy ? "You got corrected." : "Lost.";
    return spicy ? "Тебя поправили." : "Поражение.";
  }
  if (LANG === "cn") return spicy ? "干净利落。" : "胜利。";
  if (LANG === "en") return spicy ? "Clean." : "Win.";
  return spicy ? "Чисто." : "Победа.";
}

function animateHit(win) {
  ui.enemyCard?.classList.remove("is-shake");
  ui.enemyCard?.getBoundingClientRect?.();
  ui.enemyCard?.classList.add("is-shake");

  if (win) {
    ui.coins?.classList.remove("is-pop");
    ui.coins?.getBoundingClientRect?.();
    ui.coins?.classList.add("is-pop");
  }
}

ui.btnPveFight.addEventListener("click", async () => {
  ui.btnPveFight.disabled = true;

  try {
    const r = await api("/api/pve", { enemy_id: enemy.id, stake: currentStake, lang: LANG });

    const prof = r.profile;
    if (prof) {
      ME = prof;
      ui.coins.textContent = String(ME.coins ?? 0);
      ui.level.textContent = String(ME.level ?? 1);
      ui.xp.textContent = String(ME.xp ?? 0);
      ui.glory.textContent = String(ME.glory ?? 0);
    }

    const res = r.result;
    const win = !!res.win;

    // HP bar purely cosmetic: на победе “обнуляем”, иначе уменьшаем
    enemyHpPct = win ? 0 : Math.max(12, enemyHpPct - 28 - Math.floor(Math.random() * 18));
    ui.enemyHp.style.width = `${enemyHpPct}%`;

    const line = fightLine(res);
    const coinsPart = `${res.deltaCoins > 0 ? "+" : ""}${res.deltaCoins} coins`;
    const xpPart = `+${res.gainXp} xp`;
    const gloryPart = `${res.deltaGlory > 0 ? "+" : ""}${res.deltaGlory} glory`;

    ui.fightLog.textContent = `${line}  ${coinsPart} • ${xpPart} • ${gloryPart}`;

    animateHit(win);

    if (win) {
      haptic("medium");
      setTimeout(() => pickEnemy(), 450);
    } else {
      haptic("light");
    }
  } catch (e) {
    setHint(e.message || "Error");
    haptic("light");
  } finally {
    ui.btnPveFight.disabled = false;
  }
});

/* -------- SLOT (твой рабочий фронт-спин остаётся) -------- */
const SYMBOL_LABEL = {
  BAR: "BAR",
  BELL: "BELL",
  SEVEN: "7",
  CHERRY: "CH",
  STAR: "★",
  COIN: "¢",
  SCATTER: "S",
};

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

function setReelToSymbol(elStrip, rows, symbol, extraTurns = 0) {
  const rowH = 50;
  const idxs = [];
  for (let i = 0; i < rows.length; i++) if (rows[i] === symbol) idxs.push(i);
  const pick = idxs[Math.floor(Math.random() * idxs.length)];
  const centerRow = 1;
  const base = (pick - centerRow) * rowH;
  const turns = extraTurns * rows.length * rowH;
  const y = -(base + turns);
  elStrip.style.transform = `translateY(${y}px)`;
}

function slotComment(kind) {
  const RU = {
    lose: ["Ладно.", "Мимо.", "Сухо."],
    near: spicy ? ["Ну почти.", "Обидно.", "Так близко."] : ["Почти.", "Рядом.", "Мимо."],
    win: ["Окей.", "Есть.", "Неплохо."],
    big: ["Вот.", "Красиво.", "Плотно."],
    scatter: ["Бонус.", "Фриспины.", "Поехали."],
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

function setGlow(kind, bonusUntil) {
  ui.slotGlow.classList.remove("is-win","is-big","is-bonus");
  if (kind === "win" || kind === "near") ui.slotGlow.classList.add("is-win");
  if (kind === "big") ui.slotGlow.classList.add("is-big");
  if (kind === "scatter") ui.slotGlow.classList.add("is-bonus");
  if (bonusUntil && bonusUntil > Date.now()) ui.slotGlow.classList.add("is-bonus");
  ui.payline?.classList.toggle("is-hit", kind === "win" || kind === "big" || kind === "scatter");
  if (kind === "near") ui.payline?.classList.remove("is-hit");
}

function pushHistory(spin) {
  const row = document.createElement("div");
  row.className = "item";
  const sym = spin.symbols.join(" · ");
  const badge = spin.kind.toUpperCase();
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
    ui.glory.textContent = String(ME.glory ?? 0);
    ui.friendCode.textContent = String(ME.user_id || "");
    setSlotMetaFromProfile(ME);
  }

  haptic("light");

  ui.reel0.style.transition = "transform 900ms cubic-bezier(.12,72,11,1)";
  ui.reel1.style.transition = "transform 1050ms cubic-bezier(.12,72,11,1)";
  ui.reel2.style.transition = "transform 1200ms cubic-bezier(.12,72,11,1)";

  setReelToSymbol(ui.reel0, reelRows0, spin.symbols[0], 3);
  setReelToSymbol(ui.reel1, reelRows1, spin.symbols[1], 4);
  setReelToSymbol(ui.reel2, reelRows2, spin.symbols[2], 5);

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

    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;

    const free = Number(ME?.free_spins ?? 0);
    if (autoMode && free > 0) setTimeout(() => slotSpinOnce(), 450);
  }, 1250);
}

ui.btnSlotSpin.addEventListener("click", () => slotSpinOnce());
ui.btnAuto.addEventListener("click", () => {
  setAuto(!autoMode);
  const free = Number(ME?.free_spins ?? 0);
  if (autoMode && free > 0 && !spinningSlot) slotSpinOnce();
});
setAuto(autoMode);

/* -------- Boot -------- */
(function boot() {
  initTelegramUi();
  renderStaticText();
  showTab("fight");
  pickEnemy();

  if (!initData()) {
    ui.subtitle.textContent = "Open in Telegram";
    setHint("Запусти мини-приложение из бота.");
    return;
  }

  (async () => {
    try {
      await loadMe();
      await loadFriends();
      await loadDuels();
      ui.subtitle.textContent = t("lobby");
    } catch (e) {
      setHint(e.message || "Ошибка");
    }
  })();
})();
