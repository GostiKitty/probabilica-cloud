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

function haptic(type = "light") {
  try {
    tg?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-InitData": initData(),
    },
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

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
    glory: "Glory",
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
  },
};

let LANG = localStorage.getItem("lang") || "ru";
if (!I18N[LANG]) LANG = "ru";

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || key;
}

/* -------- spicy -------- */
let spicy = localStorage.getItem("spicy") === "1";

const JOKES = {
  ru: {
    pve_btn: ["Разобраться", "Нажать и забыть", "Выйти поговорить", "Тихо сделать дело"],
    pve_btn_spicy: ["Дай по щам", "Пошли разносить", "Сейчас будет разбор", "Давай жёстко"],
    pve_win: ["Чисто.", "Убедительно.", "Он понял.", "Красиво."],
    pve_win_spicy: ["Размотала. Красиво.", "По фактам.", "Слишком хорошо.", "Он сам напросился."],
    pve_lose: ["Мимо.", "Не сегодня.", "Пересоберись.", "Сухо."],
    pve_lose_spicy: ["Тебя приземлили.", "Окей. Ещё раз, без позора.", "Щелчок по самолюбию.", "Соберись и вынеси."],
    daily: (c, g) => `Дневной бонус +${c} coins • +${g} glory`,
    reward: (dc, xp, g) => `${dc > 0 ? "+" : ""}${dc} coins • +${xp} xp • ${g > 0 ? "+" : ""}${g} glory`,
    notEnough: "Недостаточно монет.",
  },
  en: {
    pve_btn: ["Fight", "Proceed", "Do it", "Take it"],
    pve_btn_spicy: ["Send it", "No mercy", "Proceed. Hard.", "Make it hurt"],
    pve_win: ["Clean.", "Approved.", "Nice.", "Convincing."],
    pve_win_spicy: ["Absolutely cooked.", "That was personal.", "Brutal. Good.", "They learned."],
    pve_lose: ["Nope.", "Not today.", "Reset.", "Try again."],
    pve_lose_spicy: ["You got checked.", "That stung.", "Again. Properly.", "We’re not done."],
    daily: (c, g) => `Daily bonus +${c} coins • +${g} glory`,
    reward: (dc, xp, g) => `${dc > 0 ? "+" : ""}${dc} coins • +${xp} xp • ${g > 0 ? "+" : ""}${g} glory`,
    notEnough: "Not enough coins.",
  },
  cn: {
    pve_btn: ["开打", "战斗", "上", "开始"],
    pve_btn_spicy: ["狠狠干", "来真的", "不讲理", "动手"],
    pve_win: ["干净。", "漂亮。", "可以。", "通过。"],
    pve_win_spicy: ["直接打穿。", "太狠了。", "很猛。", "他学会了。"],
    pve_lose: ["没事。", "再来。", "不急。", "重开。"],
    pve_lose_spicy: ["被教育了。", "有点痛。", "再狠狠干一次。", "这把不算。"],
    daily: (c, g) => `今日奖励 +${c} coins • +${g} glory`,
    reward: (dc, xp, g) => `${dc > 0 ? "+" : ""}${dc} coins • +${xp} xp • ${g > 0 ? "+" : ""}${g} glory`,
    notEnough: "硬币不够。",
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function joke(key) {
  const pack = JOKES[LANG] || JOKES.ru;
  if (spicy && pack[`${key}_spicy`]) return pick(pack[`${key}_spicy`]);
  return pick(pack[key] || ["—"]);
}

/* -------- UI -------- */
const el = (id) => document.getElementById(id);

const ui = {
  subtitle: el("subtitle"),
  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  glory: el("glory"), // может быть null, если ты не добавляла
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
  lblGlory: el("lblGlory"), // может быть null
  lblFriendCode: el("lblFriendCode"),

  tabFight: el("tabFight"),
  tabFriends: el("tabFriends"),
  tabSlot: el("tabSlot"),

  // fight
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyCard: el("enemyCard"), // если есть
  enemyHp: el("enemyHp"),     // если есть
  stakes: [...document.querySelectorAll(".stake")],
  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),

  // PvP
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

  // spicy toggle (может быть)
  btnSpicy: el("btnSpicy"),

  // toast (может быть)
  toast: el("toast"),
};

function setHint(text) {
  if (!ui.hint) return;
  ui.hint.textContent = text || "";
}

/* -------- toast + punch -------- */
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
    setTimeout(() => (ui.toast.hidden = true), 220);
  }, 1400);
}

function punch(node) {
  if (!node) return;
  node.classList.remove("is-punch");
  node.getBoundingClientRect();
  node.classList.add("is-punch");
}

/* -------- tabs -------- */
function showTab(tabName) {
  ui.tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabName));
  ui.panels.forEach((p) => (p.hidden = p.dataset.panel !== tabName));
  setHint("");
}

ui.tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

/* -------- render labels -------- */
function renderUiText() {
  if (ui.subtitle) ui.subtitle.textContent = t("lobby");

  if (ui.lblCoins) ui.lblCoins.textContent = t("coins");
  if (ui.lblLevel) ui.lblLevel.textContent = t("level");
  if (ui.lblXp) ui.lblXp.textContent = t("xp");
  if (ui.lblGlory) ui.lblGlory.textContent = t("glory");
  if (ui.lblFriendCode) ui.lblFriendCode.textContent = t("friendCode");
  if (ui.btnCopyCode) ui.btnCopyCode.textContent = t("copy");

  if (ui.tabFight) ui.tabFight.textContent = t("fight");
  if (ui.tabFriends) ui.tabFriends.textContent = t("friends");
  if (ui.tabSlot) ui.tabSlot.textContent = t("slot");

  if (ui.ttlPve) ui.ttlPve.textContent = t("pve");
  if (ui.ttlPvp) ui.ttlPvp.textContent = t("pvp");
  if (ui.ttlFriends) ui.ttlFriends.textContent = t("friends");
  if (ui.ttlDuels) ui.ttlDuels.textContent = t("duels");
  if (ui.ttlSlot) ui.ttlSlot.textContent = t("slot");
  if (ui.ttlHistory) ui.ttlHistory.textContent = t("history");

  if (ui.lblFree) ui.lblFree.textContent = t("free");
  if (ui.lblMeter) ui.lblMeter.textContent = t("meter");

  if (ui.btnAddFriend) ui.btnAddFriend.textContent = t("add");
  if (ui.btnCreateDuel) ui.btnCreateDuel.textContent = t("challenge");
  if (ui.btnSlotSpin) ui.btnSlotSpin.textContent = t("slotSpin");
  if (ui.btnAuto) ui.btnAuto.textContent = t("slotAuto");

  if (ui.btnPveFight) ui.btnPveFight.textContent = joke("pve_btn");

  if (ui.btnSpicy) ui.btnSpicy.textContent = spicy ? "On" : "Off";
}

function applyLang(newLang) {
  LANG = newLang;
  localStorage.setItem("lang", LANG);
  renderUiText();
  renderEnemy();
}

/* -------- settings modal (language) -------- */
function openSettings() {
  if (!ui.settingsModal || !ui.settingsBackdrop) return;
  ui.settingsBackdrop.hidden = false;
  ui.settingsModal.hidden = false;
}

function closeSettings() {
  if (!ui.settingsModal || !ui.settingsBackdrop) return;
  ui.settingsModal.hidden = true;
  ui.settingsBackdrop.hidden = true;
}

if (ui.btnSettings) ui.btnSettings.addEventListener("click", openSettings);
if (ui.settingsClose) ui.settingsClose.addEventListener("click", closeSettings);
if (ui.settingsBackdrop) ui.settingsBackdrop.addEventListener("click", closeSettings);

ui.langBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.dataset.lang;
    if (!I18N[lang]) return;
    applyLang(lang);
    closeSettings();
  });
});

/* -------- spicy toggle -------- */
if (ui.btnSpicy) {
  ui.btnSpicy.addEventListener("click", () => {
    spicy = !spicy;
    localStorage.setItem("spicy", spicy ? "1" : "0");
    renderUiText();
    toast(spicy ? "On." : "Off.");
  });
}

/* -------- state -------- */
let ME = null;

/* -------- enemies (frontend cosmetic list) -------- */
const ENEMIES = [
  { id: "electro_ded", ru: "ЭлектроДед", en: "Electro Grandpa", cn: "电爷",
    sub_ru: "Пахнет озоном и уверенностью.", sub_en: "Smells like ozone and confidence.", sub_cn: "一股自信的臭氧味。" },
  { id: "axisless_graph", ru: "График Без Оси", en: "Axisless Graph", cn: "没坐标的图",
    sub_ru: "Пугает преподавателей.", sub_en: "Terrifies instructors.", sub_cn: "老师看了沉默。" },
  { id: "seedless_rng", ru: "Рандом без seed", en: "Seedless RNG", cn: "无种随机",
    sub_ru: "Нечестный, но официальный.", sub_en: "Unfair, yet official.", sub_cn: "不讲道理但合规。" },
  { id: "latex_error", ru: "Синтаксис в LaTeX", en: "LaTeX Error", cn: "LaTeX 报错",
    sub_ru: "Съедает время.", sub_en: "Consumes time.", sub_cn: "吞时间。" },
  { id: "deadline", ru: "Дедлайн", en: "Deadline", cn: "截止日期",
    sub_ru: "Он всегда быстрее.", sub_en: "Always faster than you.", sub_cn: "永远更快。" },
];

let currentEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
let currentStake = 25;

function renderEnemy() {
  if (!ui.enemyName) return;
  const e = currentEnemy;
  const name = LANG === "cn" ? e.cn : LANG === "en" ? e.en : e.ru;
  const sub = LANG === "cn" ? e.sub_cn : LANG === "en" ? e.sub_en : e.sub_ru;

  ui.enemyName.textContent = name;
  if (ui.enemySub) ui.enemySub.textContent = sub;
}

function pickEnemy() {
  currentEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  renderEnemy();
  if (ui.enemyHp) ui.enemyHp.style.width = "100%";
}

ui.stakes.forEach((btn) => {
  btn.addEventListener("click", () => {
    ui.stakes.forEach((b) => b.classList.remove("btn--primary"));
    btn.classList.add("btn--primary");
    currentStake = Number(btn.dataset.stake || 25);
    haptic("light");
    toast((LANG === "ru" ? `Ставка ${currentStake}` : LANG === "cn" ? `下注 ${currentStake}` : `Stake ${currentStake}`));
  });
});

// default highlight stake 25 if exists
ui.stakes.forEach((btn) => {
  if (String(btn.dataset.stake) === "25") btn.classList.add("btn--primary");
});

/* -------- profile -------- */
async function loadMe() {
  const p = await api("/api/me");
  ME = p;

  if (ui.coins) ui.coins.textContent = String(p.coins ?? 0);
  if (ui.level) ui.level.textContent = String(p.level ?? 1);
  if (ui.xp) ui.xp.textContent = String(p.xp ?? 0);
  if (ui.glory) ui.glory.textContent = String(p.glory ?? 0);

  if (ui.friendCode) ui.friendCode.textContent = String(p.user_id || "");
  if (ui.freeSpins) ui.freeSpins.textContent = String(p.free_spins ?? 0);
  if (ui.meter) ui.meter.textContent = String(p.meter ?? 0);
}

if (ui.btnRefresh) {
  ui.btnRefresh.addEventListener("click", async () => {
    ui.btnRefresh.disabled = true;
    try {
      await loadMe();
      await loadFriends();
      await loadDuels();
      toast(LANG === "ru" ? "Обновлено." : LANG === "cn" ? "刷新了。" : "Updated.");
    } catch (e) {
      setHint(e.message || "Error");
    } finally {
      ui.btnRefresh.disabled = false;
    }
  });
}

if (ui.btnCopyCode) {
  ui.btnCopyCode.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(String(ME?.user_id || ""));
      haptic("light");
      toast(LANG === "ru" ? "Скопировано." : LANG === "cn" ? "复制了。" : "Copied.");
    } catch {
      toast("Copy failed", "bad");
    }
  });
}

/* -------- friends -------- */
async function loadFriends() {
  const r = await api("/api/friends");
  const ids = r.friends || [];

  if (!ui.friendsList) return;

  ui.friendsList.innerHTML = "";
  if (ids.length === 0) {
    ui.friendsList.innerHTML = `<div class="result">${
      LANG === "ru" ? "Пока пусто. Добавь друга по id." : LANG === "cn" ? "还没有好友。" : "No friends yet."
    }</div>`;
    return;
  }

  for (const id of ids) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${id}</div>
        <div class="item__sub">${LANG === "ru" ? "друг" : LANG === "cn" ? "好友" : "friend"}</div>
      </div>
      <button class="mini-btn">${t("challenge")}</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      if (ui.pvpToId) ui.pvpToId.value = String(id);
      showTab("fight");
      haptic("light");
    });
    ui.friendsList.appendChild(row);
  }
}

if (ui.btnAddFriend) {
  ui.btnAddFriend.addEventListener("click", async () => {
    const friend_id = ui.friendIdInput?.value?.trim();
    if (!friend_id) return;

    ui.btnAddFriend.disabled = true;
    try {
      await api("/api/friends", { friend_id });
      if (ui.friendIdInput) ui.friendIdInput.value = "";
      await loadFriends();
      toast(LANG === "ru" ? "Готово." : LANG === "cn" ? "完成。" : "Done.", "win");
    } catch (e) {
      toast(e.message || "Error", "bad");
    } finally {
      ui.btnAddFriend.disabled = false;
    }
  });
}

/* -------- duels -------- */
async function loadDuels() {
  const r = await api("/api/duels");
  const duels = r.duels || [];

  if (!ui.duelsList) return;

  ui.duelsList.innerHTML = "";

  if (duels.length === 0) {
    ui.duelsList.innerHTML = `<div class="result">${
      LANG === "ru" ? "Дуэлей пока нет." : LANG === "cn" ? "还没有决斗。" : "No duels yet."
    }</div>`;
    return;
  }

  for (const d of duels) {
    const status = d.resolved
      ? d.winner === (ME?.user_id)
        ? "WIN"
        : "LOSE"
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
          if (ui.duelLog) ui.duelLog.textContent = `Resolved. Winner: ${rr.winner_id}`;
          toast(LANG === "ru" ? "Принято." : LANG === "cn" ? "已接受。" : "Accepted.", "win");
          await loadDuels();
          await loadMe();
        } catch (e) {
          if (ui.duelLog) ui.duelLog.textContent = e.message || "Error";
          toast(e.message || "Error", "bad");
        } finally {
          btn.disabled = false;
        }
      });
    }

    ui.duelsList.appendChild(row);
  }
}

if (ui.btnCreateDuel) {
  ui.btnCreateDuel.addEventListener("click", async () => {
    const toId = ui.pvpToId?.value?.trim();
    const stake = Number(ui.pvpStake?.value || 25);
    if (!toId) return;

    ui.btnCreateDuel.disabled = true;
    if (ui.duelLog) ui.duelLog.textContent = LANG === "ru" ? "Создаю вызов…" : LANG === "cn" ? "创建挑战…" : "Creating…";

    try {
      const r = await api("/api/duel_create", { to_id: Number(toId), stake });
      if (ui.duelLog) ui.duelLog.textContent =
        `${LANG === "ru" ? "Вызов создан" : LANG === "cn" ? "挑战已创建" : "Created"}: ${r.duel.duel_id}`;
      toast(LANG === "ru" ? "Вызов отправлен." : LANG === "cn" ? "已发起挑战。" : "Challenge sent.", "win");
      await loadDuels();
    } catch (e) {
      if (ui.duelLog) ui.duelLog.textContent = e.message || "Error";
      toast(e.message || "Error", "bad");
    } finally {
      ui.btnCreateDuel.disabled = false;
    }
  });
}

/* -------- PvE (SERVER authoritative) -------- */
if (ui.btnPveFight) {
  ui.btnPveFight.addEventListener("click", async () => {
    if (!ME) return;

    const coins = Number(ME.coins ?? 0);
    if (coins < currentStake) {
      if (ui.fightLog) ui.fightLog.textContent = (JOKES[LANG] || JOKES.ru).notEnough;
      toast((JOKES[LANG] || JOKES.ru).notEnough, "bad");
      return;
    }

    ui.btnPveFight.disabled = true;
    if (ui.fightLog) ui.fightLog.textContent = LANG === "ru" ? "Идёт разбор…" : LANG === "cn" ? "处理中…" : "Processing…";

    try {
      const r = await api("/api/pve", {
        enemy_id: currentEnemy.id,
        stake: currentStake,
        lang: LANG,
      });

      // обновим профиль
      if (r.profile) {
        ME = r.profile;
        if (ui.coins) ui.coins.textContent = String(ME.coins ?? 0);
        if (ui.level) ui.level.textContent = String(ME.level ?? 1);
        if (ui.xp) ui.xp.textContent = String(ME.xp ?? 0);
        if (ui.glory) ui.glory.textContent = String(ME.glory ?? 0);
      }

      const res = r.result;
      const win = !!res.win;

      const line = win ? joke("pve_win") : joke("pve_lose");
      const pack = JOKES[LANG] || JOKES.ru;
      const reward = pack.reward(res.deltaCoins, res.gainXp, res.deltaGlory);

      if (ui.fightLog) ui.fightLog.textContent = `${line}\n${reward}`;

      toast(line, win ? "win" : "bad");
      punch(ui.enemyCard);
      if (win) punch(ui.coins);

      // daily bonus toast
      if (r.daily?.triggered) {
        toast(pack.daily(r.daily.coins, r.daily.glory), "win");
      }

      // cosmetic HP bar
      if (ui.enemyHp) {
        ui.enemyHp.style.width = win ? "0%" : "62%";
      }

      if (win) {
        haptic("medium");
        setTimeout(() => {
          pickEnemy();
          if (ui.enemyHp) ui.enemyHp.style.width = "100%";
        }, 420);
      } else {
        haptic("light");
      }
    } catch (e) {
      if (ui.fightLog) ui.fightLog.textContent = e.message || "Error";
      toast(e.message || "Error", "bad");
    } finally {
      ui.btnPveFight.disabled = false;
      ui.btnPveFight.textContent = joke("pve_btn");
    }
  });
}

/* =========================
   SLOT FRONTEND
========================= */

const SYMBOL_LABEL = {
  BAR: "BAR",
  BELL: "BELL",
  SEVEN: "7",
  CHERRY: "CH",
  STAR: "★",
  COIN: "¢",
  SCATTER: "S",
};

const ORDER = ["BAR", "BELL", "SEVEN", "CHERRY", "STAR", "COIN", "SCATTER"];

function buildReelStrip(elStrip) {
  const repeats = 40;
  const rows = [];
  for (let i = 0; i < ORDER.length * repeats; i++) rows.push(ORDER[i % ORDER.length]);
  elStrip.innerHTML = rows
    .map((s) => `<div class="sym sym--${s}"><span>${SYMBOL_LABEL[s]}</span></div>`)
    .join("");
  return rows;
}

const reelRows0 = ui.reel0 ? buildReelStrip(ui.reel0) : [];
const reelRows1 = ui.reel1 ? buildReelStrip(ui.reel1) : [];
const reelRows2 = ui.reel2 ? buildReelStrip(ui.reel2) : [];

function setReelToSymbol(elStrip, rows, symbol, extraTurns = 0) {
  const rowH = 50;
  const idxs = [];
  for (let i = 0; i < rows.length; i++) if (rows[i] === symbol) idxs.push(i);
  const pickIdx = idxs.length ? idxs[Math.floor(Math.random() * idxs.length)] : 0;
  const centerRow = 1;
  const base = (pickIdx - centerRow) * rowH;
  const turns = extraTurns * rows.length * rowH;
  const y = -(base + turns);
  elStrip.style.transform = `translateY(${y}px)`;
}

function pushHistory(spin) {
  if (!ui.slotHistory) return;

  const row = document.createElement("div");
  row.className = "item";
  const sym = spin.symbols.join(" · ");
  const badge = String(spin.kind || "").toUpperCase();

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
  if (!ui.slotGlow) return;

  ui.slotGlow.classList.remove("is-win", "is-big", "is-bonus", "is-flash");
  if (kind === "win" || kind === "near") ui.slotGlow.classList.add("is-win");
  if (kind === "big") ui.slotGlow.classList.add("is-big");
  if (kind === "scatter") ui.slotGlow.classList.add("is-bonus");
  if (bonusUntil && bonusUntil > Date.now()) ui.slotGlow.classList.add("is-bonus");

  if (kind === "win" || kind === "big" || kind === "scatter") {
    ui.slotGlow.getBoundingClientRect();
    ui.slotGlow.classList.add("is-flash");
  }

  if (ui.payline) {
    ui.payline.classList.toggle("is-hit", kind === "win" || kind === "big" || kind === "scatter");
    if (kind === "near") ui.payline.classList.remove("is-hit");
  }
}

function slotComment(kind) {
  const RU = {
    lose: ["Ладно.", "Мимо.", "Сухо."],
    near: spicy ? ["Ну почти.", "Обидно.", "Так близко."] : ["Почти.", "Рядом.", "Мимо."],
    win: ["Окей.", "Есть.", "Неплохо."],
    big: spicy
      ? ["Ого. Это грязно. Мне нравится.", "Разъ*б.", "Слишком хорошо.", "Наконец-то нормально."]
      : ["Вот.", "Красиво.", "Плотно.", "Есть."],
    scatter: spicy
      ? ["Фриспины. Пошло мясо.", "Окей. Понеслась.", "Бонус. Не дыши."]
      : ["Бонус.", "Фриспины.", "Поехали."],
    meter: ["Шкала закрыта.", "Фриспины.", "Включилось."],
  };

  const EN = {
    lose: ["No.", "Miss.", "Dry."],
    near: ["Close.", "Almost.", "So close."],
    win: ["Ok.", "Win.", "Nice."],
    big: spicy ? ["That’s nasty. Good.", "Big hit.", "Finally.", "Clean."] : ["Big.", "Nice.", "Good."],
    scatter: spicy ? ["Bonus. Don’t blink.", "Free spins. Go.", "Now it starts."] : ["Bonus.", "Free spins.", "Go."],
    meter: ["Meter popped.", "Free spins.", "Good."],
  };

  const CN = {
    lose: ["没关系。", "不急。", "今天不行。"],
    near: ["差一点。", "就差一点。", "太近了。"],
    win: ["还行。", "不错。", "可以。"],
    big: spicy ? ["太狠了。", "很猛。", "漂亮。", "终于像话。"] : ["很猛。", "漂亮。", "大赢。"],
    scatter: spicy ? ["奖励来了。别眨眼。", "免费旋转。走起。", "开始了。"] : ["进奖励。", "免费旋转。", "开始了。"],
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
  if (ui.btnAuto) {
    ui.btnAuto.classList.toggle("btn--primary", autoMode);
    ui.btnAuto.classList.toggle("btn--secondary", !autoMode);
  }
}

async function slotSpinOnce() {
  if (spinningSlot) return;
  if (!ME) return;

  spinningSlot = true;
  if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = true;
  if (ui.btnAuto) ui.btnAuto.disabled = true;

  let resp;
  try {
    resp = await api("/api/spin", {});
  } catch (e) {
    if (ui.slotComment) ui.slotComment.textContent = e.message || "Error";
    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;
    spinningSlot = false;
    return;
  }

  const spin = resp.spin;
  const prof = resp.profile;

  if (prof) {
    ME = prof;
    if (ui.coins) ui.coins.textContent = String(ME.coins ?? 0);
    if (ui.level) ui.level.textContent = String(ME.level ?? 1);
    if (ui.xp) ui.xp.textContent = String(ME.xp ?? 0);
    if (ui.glory) ui.glory.textContent = String(ME.glory ?? 0);
    if (ui.freeSpins) ui.freeSpins.textContent = String(ME.free_spins ?? 0);
    if (ui.meter) ui.meter.textContent = String(ME.meter ?? 0);
    if (ui.friendCode) ui.friendCode.textContent = String(ME.user_id || "");
  }

  haptic("light");

  if (ui.reel0) ui.reel0.style.transition = "transform 900ms cubic-bezier(.12,.72,.11,1)";
  if (ui.reel1) ui.reel1.style.transition = "transform 1050ms cubic-bezier(.12,.72,.11,1)";
  if (ui.reel2) ui.reel2.style.transition = "transform 1200ms cubic-bezier(.12,.72,.11,1)";

  if (ui.reel0) setReelToSymbol(ui.reel0, reelRows0, spin.symbols[0], 3);
  if (ui.reel1) setReelToSymbol(ui.reel1, reelRows1, spin.symbols[1], 4);
  if (ui.reel2) setReelToSymbol(ui.reel2, reelRows2, spin.symbols[2], 5);

  setTimeout(() => haptic("light"), 900);
  setTimeout(() => haptic("light"), 1050);
  setTimeout(() => haptic("medium"), 1200);

  setTimeout(() => {
    const kind = spin.meter_triggered ? "meter" : spin.kind;

    if (ui.slotComment) ui.slotComment.textContent = slotComment(kind);
    setGlow(spin.kind, spin.bonus_until);
    pushHistory(spin);

    if (ui.drop) {
      if (spin.drop) {
        ui.drop.hidden = false;
        if (ui.dropTitle) ui.dropTitle.textContent = spin.drop.title || "Drop";
        if (ui.dropSub) ui.dropSub.textContent = spin.drop.effect || "";
      } else {
        ui.drop.hidden = true;
      }
    }

    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;
    spinningSlot = false;

    const free = Number(ME?.free_spins ?? 0);
    if (autoMode && free > 0) setTimeout(() => slotSpinOnce(), 450);
  }, 1250);
}

if (ui.btnSlotSpin) ui.btnSlotSpin.addEventListener("click", () => slotSpinOnce());
if (ui.btnAuto) {
  ui.btnAuto.addEventListener("click", () => {
    setAuto(!autoMode);
    const free = Number(ME?.free_spins ?? 0);
    if (autoMode && free > 0 && !spinningSlot) slotSpinOnce();
  });
  setAuto(autoMode);
}

/* -------- boot -------- */
(function boot() {
  initTelegramUi();
  renderUiText();
  showTab("fight");
  pickEnemy();

  if (!initData()) {
    if (ui.subtitle) ui.subtitle.textContent = "Open in Telegram";
    setHint(LANG === "ru" ? "Запусти мини-приложение из бота." : LANG === "cn" ? "请从机器人打开。" : "Open from the bot.");
    return;
  }

  (async () => {
    try {
      await loadMe();
      await loadFriends();
      await loadDuels();
    } catch (e) {
      setHint(e.message || "Error");
    }
  })();
})();
