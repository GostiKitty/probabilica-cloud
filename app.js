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

/* -------- i18n -------- */
const I18N = {
  ru: {
    lobby: "Лобби",
    coins: "Монеты",
    level: "Уровень",
    xp: "Опыт",
    friendCode: "Friend code",
    copy: "Скопировать",
    fight: "Бой",
    friends: "Друзья",
    slot: "Слот",
    pve: "PvE",
    pvp: "PvP",
    add: "Добавить",
    duels: "Дуэли",
    settings: "Настройки",
    language: "Язык",
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
    friendCode: "Friend code",
    copy: "Copy",
    fight: "Fight",
    friends: "Friends",
    slot: "Slot",
    pve: "PvE",
    pvp: "PvP",
    add: "Add",
    duels: "Duels",
    settings: "Settings",
    language: "Language",
    challenge: "Challenge",
    accept: "Accept",
    slotSpin: "Spin",
    slotAuto: "Auto",
    free: "Free",
    meter: "Meter",
    history: "History",

  },
  cn: {
    lobby: "大厅",
    coins: "硬币",
    level: "等级",
    xp: "经验",
    friendCode: "好友码",
    copy: "复制",
    fight: "战斗",
    friends: "好友",
    slot: "老虎机",
    pve: "PvE",
    pvp: "PvP",
    add: "添加",
    duels: "决斗",
    settings: "设置",
    language: "语言",
    challenge: "挑战",
    accept: "接受",
    slotSpin: "旋转",
    slotAuto: "自动",
    free: "免费",
    meter: "进度",
    history: "记录",

  }
};
let LANG = localStorage.getItem("lang") || "ru";
function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || key;
}
function setLang(l) {
  LANG = l;
  localStorage.setItem("lang", l);
  renderStaticText();
  renderSpicy();
  loadFriends().catch(()=>{});
  loadDuels().catch(()=>{});
  pickEnemy();
}

/* -------- enemies -------- */
const ENEMIES = {
  ru: [
    { name: "Человек из УК", sub: "всегда прав, особенно когда неправ" },
    { name: "Сосед с перфоратором", sub: "урон по расписанию: всегда" },
    { name: "Авито-логист", sub: "«я уже выехал» — третий день" },
    { name: "Хранитель подъездного чата", sub: "режет удачу морально" },
    { name: "Кассир без сдачи", sub: "обнуляет твою надежду" },
    { name: "Парень «верну щас»", sub: "умеет жить без монет" },
  ],
  en: [
    { name: "LinkedIn Paladin", sub: "buffs himself with motivation quotes" },
    { name: "DoorDash Stoic", sub: "arrives late, hits first" },
    { name: "Crypto Since 2021", sub: "sometimes damages himself" },
    { name: "Pre-Revenue Founder", sub: "big pitch, tiny damage" },
    { name: "Gym Algorithm", sub: "STR high, INT optional" },
    { name: "Spreadsheet Wizard", sub: "crit chance suspiciously consistent" },
  ],
  cn: [
    { name: "美团骑手·超时警告", sub: "快，但状态条很短" },
    { name: "小红书审判官", sub: "一句话让你怀疑 себя" },
    { name: "夜市秤王", sub: "всегда знает, где ты недовесил" },
    { name: "红包计算器", sub: "считает выгоду быстрее тебя" },
    { name: "早八学生·愤怒版", sub: "маленький, но злой" },
    { name: "老板不在店", sub: "непредсказуем по таймингам" },
  ]
};

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const el = (id) => document.getElementById(id);
const ui = {
  subtitle: el("subtitle"),
  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  hint: el("hint"),

  friendCode: el("friendCode"),
  btnCopyCode: el("btnCopyCode"),

  btnRefresh: el("btnRefresh"),
  btnSettings: el("btnSettings"),

  // tabs
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll("[data-panel]")],

  // labels
  lblCoins: el("lblCoins"),
  lblLevel: el("lblLevel"),
  lblXp: el("lblXp"),
  lblFriendCode: el("lblFriendCode"),

  tabFight: el("tabFight"),
  tabFriends: el("tabFriends"),
  tabSlot: el("tabSlot"),

  // fight
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  stakes: [...document.querySelectorAll(".stake")],
  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),

  pvpToId: el("pvpToId"),
  pvpStake: el("pvpStake"),
  btnCreateDuel: el("btnCreateDuel"),
  duelLog: el("duelLog"),

  // friends
  friendIdInput: el("friendIdInput"),
  btnAddFriend: el("btnAddFriend"),
  friendsList: el("friendsList"),
  duelsList: el("duelsList"),

  // settings modal
  settingsModal: el("settingsModal"),
  settingsBackdrop: el("settingsBackdrop"),
  settingsClose: el("settingsClose"),
  settingsOk: el("settingsOk"),
  ttlSettings: el("ttlSettings"),
  lblLang: el("lblLang"),
  langBtns: [...document.querySelectorAll(".lang")],

  // titles
  ttlPve: el("ttlPve"),
  ttlPvp: el("ttlPvp"),
  ttlFriends: el("ttlFriends"),
  ttlDuels: el("ttlDuels"),
    // slot
  ttlSlot: el("ttlSlot"),
  lblFree: el("lblFree"),
  lblMeter: el("lblMeter"),
  freeSpins: el("freeSpins"),
  meter: el("meter"),
  btnSlotSpin: el("btnSlotSpin"),
  btnAuto: el("btnAuto"),
  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  slotComment: el("slotComment"),
  slotHistory: el("slotHistory"),
  slotGlow: el("slotGlow"),
  ttlHistory: el("ttlHistory"),
  payline: document.querySelector(".payline"),
  drop: el("drop"),
  dropTitle: el("dropTitle"),
  dropSub: el("dropSub"),
  btnSpicy: el("btnSpicy"),




};

function setHint(msg) { ui.hint.textContent = msg || ""; }

function setLoading(on) {
  const nodes = [ui.coins, ui.level, ui.xp];
  for (const n of nodes) {
    n.classList.toggle("skeleton", on);
    if (on) n.textContent = "";
  }
}

let ME = null;
let currentStake = 25;

function renderStaticText() {
  ui.subtitle.textContent = t("lobby");
  ui.lblCoins.textContent = t("coins");
  ui.lblLevel.textContent = t("level");
  ui.lblXp.textContent = t("xp");
  ui.lblFriendCode.textContent = t("friendCode");

  ui.tabFight.textContent = t("fight");
  ui.tabFriends.textContent = t("friends");
  ui.tabSlot.textContent = t("slot");

  ui.ttlPve.textContent = t("pve");
  ui.ttlPvp.textContent = t("pvp");
  ui.ttlFriends.textContent = t("friends");
  ui.ttlDuels.textContent = t("duels");

  ui.ttlSettings.textContent = t("settings");
  ui.lblLang.textContent = t("language");

  ui.btnAddFriend.textContent = t("add");
  ui.btnCreateDuel.textContent = t("challenge");
  
  ui.ttlSlot.textContent = t("slot");
  ui.lblFree.textContent = t("free");
  ui.lblMeter.textContent = t("meter");
  ui.btnSlotSpin.textContent = t("slotSpin");
  ui.btnAuto.textContent = t("slotAuto");
  ui.ttlHistory.textContent = t("history");
  

}

function openSettings() { ui.settingsModal.hidden = false; }
function closeSettings() { ui.settingsModal.hidden = true; }

ui.btnSettings.addEventListener("click", openSettings);
ui.settingsBackdrop.addEventListener("click", closeSettings);
ui.settingsClose.addEventListener("click", closeSettings);
ui.settingsOk.addEventListener("click", closeSettings);

ui.langBtns.forEach(b => {
  b.addEventListener("click", () => setLang(b.dataset.lang));
});

function switchTab(name) {
  ui.tabs.forEach(t => t.classList.toggle("tab--active", t.dataset.tab === name));
  ui.panels.forEach(p => p.hidden = p.dataset.panel !== name);
}
ui.tabs.forEach(tbtn => tbtn.addEventListener("click", () => switchTab(tbtn.dataset.tab)));

function pickEnemy() {
  const pack = ENEMIES[LANG] || ENEMIES.ru;
  const e = randFrom(pack);
  ui.enemyName.textContent = e.name;
  ui.enemySub.textContent = e.sub;
  return e;
}

function commentFightWin() {
  const variants = {
    ru: ["Ты был убедительнее.", "Сработало. Не спрашивай почему.", "Вот это уже разговор."],
    en: ["Clean.", "That worked. Somehow.", "Nice one."],
    cn: ["不错。", "可以。", "你赢了。"]
  };
  return randFrom(variants[LANG] || variants.ru);
}
function commentFightLose() {
  const variants = {
    ru: ["Не прокатило.", "Ладно. Живём.", "Ну блядь. Бывает."],
    en: ["Unlucky.", "Didn’t work.", "Run it back."],
    cn: ["没关系。", "再来一次。", "差一点。"]
  };
  return randFrom(variants[LANG] || variants.ru);
}

async function loadMe() {
  setLoading(true);
  setHint("…");
  const me = await api("/api/me");
  ME = me;
  setSlotMetaFromProfile(ME);
  ui.coins.textContent = String(me.coins ?? 0);
  ui.level.textContent = String(me.level ?? 1);
  ui.xp.textContent = String(me.xp ?? 0);
  ui.friendCode.textContent = String(me.user_id || "");
  setLoading(false);
  setHint("");
}

ui.btnRefresh.addEventListener("click", () => loadMe().catch(e => setHint(e.message)));

ui.btnCopyCode.addEventListener("click", async () => {
  const code = ui.friendCode.textContent.trim();
  try {
    await navigator.clipboard.writeText(code);
    setHint(LANG === "ru" ? "Скопировано." : LANG === "cn" ? "已复制。" : "Copied.");
    setTimeout(() => setHint(""), 800);
  } catch {
    setHint("Copy failed");
  }
});

/* ----- PvE fight (local sim, rewards via /api/spin later) ----- */
ui.stakes.forEach(b => {
  b.addEventListener("click", () => {
    currentStake = Number(b.dataset.stake);
    ui.stakes.forEach(x => x.classList.toggle("btn--primary", x === b));
    ui.stakes.forEach(x => x.classList.toggle("btn--secondary", x !== b));
  });
});
// default
ui.stakes[1].click();

ui.btnPveFight.addEventListener("click", async () => {
  if (!ME) return;

  const coins = Number(ME.coins ?? 0);
  if (coins < currentStake) {
    ui.fightLog.textContent = LANG === "ru" ? "Недостаточно монет." : LANG === "cn" ? "硬币不够。" : "Not enough coins.";
    return;
  }

  // простая симуляция (MVP)
  const winChance = 0.48 + Math.min(0.2, (ME.level ?? 1) * 0.01);
  const won = Math.random() < winChance;

  const delta = won ? currentStake : -Math.floor(currentStake * 0.6);
  ME.coins = coins + delta;

  ui.coins.textContent = String(ME.coins);
  ui.fightLog.textContent = won
    ? `${commentFightWin()}  +${currentStake}`
    : `${commentFightLose()}  ${delta}`;

  // сохраняем coins через /api/spin не трогаем — это позже сделаем отдельным endpoint.
});

/* ----- Friends API ----- */
async function loadFriends() {
  const r = await api("/api/friends");
  const ids = r.friends || [];
  ui.friendsList.innerHTML = "";

  if (ids.length === 0) {
    ui.friendsList.innerHTML = `<div class="result">${LANG === "ru" ? "Пока пусто. Добавь друга по friend id." : LANG === "cn" ? "还没有好友。" : "No friends yet."}</div>`;
    return;
  }

  for (const id of ids) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${id}</div>
        <div class="item__sub">${LANG === "ru" ? "friend" : LANG === "cn" ? "好友" : "friend"}</div>
      </div>
      <button class="mini-btn duelBtn">${t("challenge")}</button>
    `;
    row.querySelector(".duelBtn").addEventListener("click", () => {
      ui.pvpToId.value = String(id);
      switchTab("fight");
      ui.duelLog.textContent = "";
    });
    ui.friendsList.appendChild(row);
  }
}

ui.btnAddFriend.addEventListener("click", async () => {
  const friendId = ui.friendIdInput.value.trim();
  if (!friendId) return;

  ui.btnAddFriend.disabled = true;
  setHint(LANG === "ru" ? "Добавляю…" : LANG === "cn" ? "添加中…" : "Adding…");
  try {
    await api("/api/friends", { friend_id: friendId });
    ui.friendIdInput.value = "";
    await loadFriends();
    setHint(LANG === "ru" ? "Готово." : LANG === "cn" ? "完成。" : "Done.");
    setTimeout(() => setHint(""), 900);
  } catch (e) {
    setHint(e.message || "Error");
  } finally {
    ui.btnAddFriend.disabled = false;
  }
});

/* ----- Duels ----- */
async function loadDuels() {
  const r = await api("/api/duels");
  const duels = r.duels || [];
  ui.duelsList.innerHTML = "";

  if (duels.length === 0) {
    ui.duelsList.innerHTML = `<div class="result">${LANG === "ru" ? "Дуэлей пока нет." : LANG === "cn" ? "还没有决斗。" : "No duels yet."}</div>`;
    return;
  }

  for (const d of duels) {
    const status = d.resolved
      ? (d.winner === (ME?.user_id) ? "WIN" : "LOSE")
      : "PENDING";

    const row = document.createElement("div");
    row.className = "item";

    const title = `${d.from} → ${d.to}`;
    const sub = `${status} • stake ${d.stake} • ${new Date(d.created_ts).toLocaleString()}`;

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      ${d.resolved ? "" : `<button class="mini-btn resolveBtn">${t("accept")}</button>`}
    `;

    const btn = row.querySelector(".resolveBtn");
    if (btn) {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          const rr = await api("/api/duel_resolve", { duel_id: d.duel_id });
          ui.duelLog.textContent = `Resolved. Winner: ${rr.winner_id}`;
          await loadDuels();
          await loadMe();
        } catch (e) {
          ui.duelLog.textContent = e.message || "Error";
        } finally {
          btn.disabled = false;
        }
      });
    }

    ui.duelsList.appendChild(row);
  }
}

ui.btnCreateDuel.addEventListener("click", async () => {
  const toId = ui.pvpToId.value.trim();
  const stake = Number(ui.pvpStake.value);

  if (!toId) return;

  ui.btnCreateDuel.disabled = true;
  ui.duelLog.textContent = LANG === "ru" ? "Создаю вызов…" : LANG === "cn" ? "创建挑战…" : "Creating…";

  try {
    const r = await api("/api/duel_create", { to_id: Number(toId), stake });
    ui.duelLog.textContent = `${LANG === "ru" ? "Вызов создан" : LANG === "cn" ? "挑战已创建" : "Created"}: ${r.duel.duel_id}`;
    await loadDuels();
  } catch (e) {
    ui.duelLog.textContent = e.message || "Error";
  } finally {
    ui.btnCreateDuel.disabled = false;
  }
});
/* =========================
   SLOT FRONTEND
========================= */

const SYMBOL_LABEL = {
  BAR: "BAR",
  BELL: "BELL",
  SEVEN: "VII",
  CHERRY: "CH",
  STAR: "STAR",
  COIN: "COIN",
  SCATTER: "PASS",
};


let autoMode = localStorage.getItem("auto") === "1";
let spicy = localStorage.getItem("spicy") !== "0"; // по умолчанию да
function setAuto(on) {
  autoMode = !!on;
  localStorage.setItem("auto", autoMode ? "1" : "0");
  ui.btnAuto.classList.toggle("btn--primary", autoMode);
  ui.btnAuto.classList.toggle("btn--secondary", !autoMode);
}

function setSlotMetaFromProfile(p) {
  ui.freeSpins.textContent = String(p.free_spins ?? 0);
  ui.meter.textContent = String(p.meter ?? 0);
}

function haptic(type) {
  try {
    tg?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

function slotComment(kind, spin) {
  const RU = {
    lose: ["Ладно. Живём.", "Не сегодня.", "Система тебя увидела."],
    near: spicy
      ? ["Ну блядь, почти.", "Вот обидно-то.", "Так близко, что больно."]
      : ["Почти.", "Обидно.", "Рядом было."],
    win: ["Не густо, но приятно.", "Окей, идём дальше.", "Нормальный заход."],
    big: ["Вот это уже разговор.", "Ты сегодня в форме.", "Красиво. Без вопросов."],
    scatter: ["Ладно. Держи фриспины.", "Система моргнула.", "О, бонус. Пошло."],
    meter: ["Терпение окупилось.", "Стабильно. Держи free.", "Ну всё, поехали."],
  };
  const EN = {
    lose: ["Unlucky.", "Not today.", "The system saw you."],
    near: ["So close.", "That hurt.", "Almost."],
    win: ["Decent.", "Keep going.", "Nice."],
    big: ["Clean.", "Big hit.", "That’s a moment."],
    scatter: ["Bonus time.", "Free spins.", "Let’s go."],
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

// render reels (strip with 3 visible rows; we animate by translating a strip with many rows)
function buildReelStrip(elStrip) {
  const order = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];
  const rows = [];
  for (let i = 0; i < 18; i++) {
    const s = order[i % order.length];
    rows.push(s);
  }
  elStrip.innerHTML = rows.map(s => `<div class="sym sym--${s}"><span>${SYMBOL_LABEL[s]}</span></div>`).join("");
  return rows;
}

const reelRows0 = buildReelStrip(ui.reel0);
const reelRows1 = buildReelStrip(ui.reel1);
const reelRows2 = buildReelStrip(ui.reel2);

function setReelToSymbol(elStrip, rows, symbol, extraTurns = 0) {
  // each row = 50px, center row index we want = 1 (middle visible)
  // We'll position so that "symbol" lands on row index k such that it's in center:
  const rowH = 50;
  const idxs = [];
  for (let i = 0; i < rows.length; i++) if (rows[i] === symbol) idxs.push(i);
  const pick = idxs[Math.floor(Math.random() * idxs.length)];
  const centerRow = 1; // visible middle
  // translateY negative moves strip up: we want row pick to align to centerRow
  const base = (pick - centerRow) * rowH;
  const turns = extraTurns * rows.length * rowH;
  const y = -(base + turns);
  elStrip.style.transform = `translateY(${y}px)`;
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
  // limit 6
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

let spinningSlot = false;

async function slotSpinOnce() {
  if (spinningSlot) return;
  spinningSlot = true;

  ui.btnSlotSpin.disabled = true;
  ui.btnAuto.disabled = true;

  // request server spin
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

  // animate reels stop one by one
  haptic("light");

  ui.reel0.style.transition = "transform 900ms cubic-bezier(.12,.72,.11,1)";
  ui.reel1.style.transition = "transform 1050ms cubic-bezier(.12,.72,.11,1)";
  ui.reel2.style.transition = "transform 1200ms cubic-bezier(.12,.72,.11,1)";

  // set targets with extraTurns to look like spin
  setReelToSymbol(ui.reel0, reelRows0, spin.symbols[0], 3);
  setReelToSymbol(ui.reel1, reelRows1, spin.symbols[1], 4);
  setReelToSymbol(ui.reel2, reelRows2, spin.symbols[2], 5);

  // haptic per stop
  setTimeout(() => haptic("light"), 900);
  setTimeout(() => haptic("light"), 1050);
  setTimeout(() => haptic("medium"), 1200);

  setTimeout(() => {
    // comment logic
    let kind = spin.kind;
    // if meter triggered => show meter comment
    if (spin.meter_triggered) {
      ui.slotComment.textContent = slotComment("meter", spin);
    } else {
      ui.slotComment.textContent = slotComment(kind, spin);
    }

    setGlow(kind, spin.bonus_until);
    pushHistory(spin);

    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
    spinningSlot = false;

    // AUTO only for free spins, and only if you have them
    const free = Number(ME?.free_spins ?? 0);
    if (autoMode && free > 0) {
      // slight delay
      setTimeout(() => slotSpinOnce(), 450);
    }
    if (spin.drop) {
      ui.drop.hidden = false;
      ui.dropTitle.textContent = spin.drop.title || "Drop";
      ui.dropSub.textContent = spin.drop.effect || "";
    } else {
      ui.drop.hidden = true;
    }

  }, 1250);
}

ui.btnSlotSpin.addEventListener("click", () => slotSpinOnce());
ui.btnAuto.addEventListener("click", () => {
  setAuto(!autoMode);
  // if turned on and has free spins, start immediately
  const free = Number(ME?.free_spins ?? 0);
  if (autoMode && free > 0 && !spinningSlot) slotSpinOnce();
});
setAuto(autoMode);


/* ----- Boot ----- */
(async function boot() {
  initTelegramUi();
  renderStaticText();

  if (!initData()) {
    ui.subtitle.textContent = "Open in Telegram";
    setHint("Запусти мини-приложение из бота.");
    setLoading(false);
    return;
  }

  try {
    pickEnemy();
    await loadMe();
    setSlotMetaFromProfile(ME);

    await loadFriends();
    await loadDuels();
  } catch (e) {
    setHint(e.message || "Ошибка");
    setLoading(false);
  }
})();
function renderSpicy() {
  ui.btnSpicy.textContent = spicy ? "On" : "Off";
  ui.btnSpicy.classList.toggle("btn--primary", spicy);
  ui.btnSpicy.classList.toggle("btn--secondary", !spicy);
}
ui.btnSpicy.addEventListener("click", () => {
  spicy = !spicy;
  localStorage.setItem("spicy", spicy ? "1" : "0");
  renderSpicy();
});

