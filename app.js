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
    await loadFriends();
    await loadDuels();
  } catch (e) {
    setHint(e.message || "Ошибка");
    setLoading(false);
  }
})();
