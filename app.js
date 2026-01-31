/* Probabilica app.js (frontend) */
/* цель: не падать, даже если каких-то id нет; Telegram touch/click; слот с прокруткой; бонус-оверлей */

function el(id) { return document.getElementById(id); }
function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ---------- UI (без падения) ---------- */
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

  // fight
  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),
  enemyCard: el("enemyCard"),
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyHp: el("enemyHp"),
  stakes: qa(".stake"),

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
  payline: q(".payline"),
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

/* ---------- helpers ---------- */
function safeText(node, text) { if (node) node.textContent = text; }
function safeHtml(node, html) { if (node) node.innerHTML = html; }
function safeToggle(node, cls, on) { if (node) node.classList.toggle(cls, !!on); }

function safeClick(node, fn) {
  if (!node) return;
  node.addEventListener("click", (e) => { e.preventDefault(); fn(e); }, { passive: false });
  node.addEventListener("touchstart", (e) => { e.preventDefault(); fn(e); }, { passive: false });
}

/* ---------- Toast ---------- */
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

function setHint(msg) { safeText(ui.hint, msg || ""); }

/* ---------- Telegram ---------- */
function tg() { return window.Telegram?.WebApp; }
function initData() { return tg()?.initData || ""; }
function haptic(type = "light") { try { tg()?.HapticFeedback?.impactOccurred?.(type); } catch {} }

function initTelegramUi() {
  const t = tg();
  if (!t) return;
  try { t.ready(); t.expand(); } catch {}
}

/* ---------- API ---------- */
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
    throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

/* ---------- Russian UI + spicy ---------- */
let LANG = "ru"; // оставляем всё на русском
let spicy = localStorage.getItem("spicy") === "1";

const TXT = {
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
  challenge: "Challenge",
  accept: "Принять",
  free: "Фриспины",
  meter: "Шкала",
  history: "History",
};

function applyTopButtons() {
  if (ui.btnLang) ui.btnLang.hidden = true; // рус-only
  if (ui.btnSpicy) safeText(ui.btnSpicy, spicy ? "On" : "Off");
}

function renderStaticText() {
  safeText(ui.subtitle, TXT.lobby);
  safeText(ui.lblCoins, TXT.coins);
  safeText(ui.lblLevel, TXT.level);
  safeText(ui.lblXp, TXT.xp);
  safeText(ui.lblGlory, TXT.glory);
  safeText(ui.lblFriendCode, TXT.friendCode);
  safeText(ui.btnCopy, TXT.copy);

  safeText(ui.tabFight, TXT.fight);
  safeText(ui.tabFriends, TXT.friends);
  safeText(ui.tabSlot, TXT.slot);

  safeText(ui.ttlPve, TXT.pve);
  safeText(ui.ttlPvp, TXT.pvp);
  safeText(ui.ttlFriends, TXT.friends);
  safeText(ui.ttlSlot, TXT.slot);
  safeText(ui.ttlHistory, TXT.history);

  safeText(ui.btnAddFriend, TXT.add);

  if (ui.btnPveFight) {
    safeText(ui.btnPveFight, spicy ? "ЕБАШЬ" : "Fight");
  }
  if (ui.btnCreateDuel) {
    safeText(ui.btnCreateDuel, spicy ? "ВЫЗВАТЬ НА РАЗБОР" : "Challenge");
  }
  if (ui.btnSlotSpin) {
    safeText(ui.btnSlotSpin, spicy ? "КРУТИ, НЕ СЫ" : "Крутить");
  }
  if (ui.btnAuto) {
    safeText(ui.btnAuto, spicy ? "АВТО (ОПАСНО)" : "Авто");
  }

  safeText(ui.lblFree, TXT.free);
  safeText(ui.lblMeter, TXT.meter);
}

safeClick(ui.btnSpicy, () => {
  spicy = !spicy;
  localStorage.setItem("spicy", spicy ? "1" : "0");
  applyTopButtons();
  renderStaticText();
  toast(spicy ? "Spicy: ON 😈" : "Spicy: OFF 🧼");
});

/* ---------- Tabs ---------- */
function showTab(name) {
  ui.panels.forEach(p => { p.hidden = (p.dataset.panel !== name); });
  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(b => b && b.classList.remove("is-active"));
  if (name === "fight") ui.tabFight?.classList.add("is-active");
  if (name === "friends") ui.tabFriends?.classList.add("is-active");
  if (name === "slot") ui.tabSlot?.classList.add("is-active");
  setHint("");
}
safeClick(ui.tabFight, () => showTab("fight"));
safeClick(ui.tabFriends, () => showTab("friends"));
safeClick(ui.tabSlot, () => showTab("slot"));

/* ---------- Profile ---------- */
let ME = null;
let currentStake = 25;

function syncProfileToUI(p) {
  safeText(ui.coins, String(p?.coins ?? 0));
  safeText(ui.level, String(p?.level ?? 1));
  safeText(ui.xp, String(p?.xp ?? 0));
  safeText(ui.glory, String(p?.glory ?? 0));
  safeText(ui.friendCode, String(p?.user_id ?? "0"));

  safeText(ui.freeSpins, String(p?.free_spins ?? 0));
  safeText(ui.meter, String(p?.meter ?? 0));
}

async function loadMe() {
  if (!initData()) {
    setHint("Открой через кнопку 🎰 в Telegram. Иначе сервер тебя шлёт.");
    toast("Нет initData. Открой через кнопку в боте.", "bad");
    return;
  }
  const r = await api("/api/me");
  ME = r.profile;
  syncProfileToUI(ME);
}

/* ---------- Copy friend code ---------- */
safeClick(ui.btnCopy, async () => {
  const code = (ui.friendCode?.textContent || "").trim();
  try {
    await navigator.clipboard.writeText(code);
    toast("Скопировано. Теперь ты официально опасна.", "win");
  } catch {
    toast("Не скопировалось. Техника в ахуе.", "bad");
  }
});

/* ---------- PvE (серверный, /api/pve) ---------- */
const ENEMIES = [
  { id: "rng", name: "Рандом без seed", sub: "ему похуй", tier: 1 },
  { id: "gost", name: "ГОСТ-призрак", sub: "приходит, когда ты счастлива", tier: 2 },
  { id: "deadline", name: "Дедлайн", sub: "дышит в затылок", tier: 3 },
  { id: "review", name: "Ревьюер", sub: "просит переписать всё (в 23:59)", tier: 4 },
];

let enemy = null;
function pickEnemy() {
  enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  safeText(ui.enemyName, `${enemy.name} · T${enemy.tier}`);
  safeText(ui.enemySub, enemy.sub);
  if (ui.enemyHp) ui.enemyHp.style.width = "100%";
}

ui.stakes.forEach(b => {
  safeClick(b, () => {
    currentStake = Number(b.dataset.stake);
    ui.stakes.forEach(x => {
      x.classList.toggle("btn--primary", x === b);
      x.classList.toggle("btn--secondary", x !== b);
    });
    toast(`Ставка: ${currentStake}. Пошли ломать судьбу.`, "info");
  });
});
if (ui.stakes[1]) ui.stakes[1].click();

safeClick(ui.btnPveFight, async () => {
  if (!enemy) pickEnemy();
  if (!initData()) { toast("Открой через Telegram. Без этого — никак.", "bad"); return; }

  try {
    ui.btnPveFight.disabled = true;
    safeText(ui.fightLog, spicy ? "Вызываем боль..." : "Бой...");

    const r = await api("/api/pve", {
      enemy_id: enemy.id,
      stake: currentStake,
      lang: "ru",
    });

    if (r.profile) {
      ME = r.profile;
      syncProfileToUI(ME);
    }

    const win = !!r.win || !!r.result?.win;
    const deltaCoins = r.deltaCoins ?? r.result?.deltaCoins ?? 0;
    const deltaGlory = r.deltaGlory ?? r.result?.deltaGlory ?? 0;

    safeText(ui.fightLog,
      win
        ? (spicy ? `Победа. +${deltaCoins} монет, +${deltaGlory} славы. Разъеб.` : `Победа. +${deltaCoins} монет.`)
        : (spicy ? `Поражение. ${deltaCoins} монет. Ну бывает, чё.` : `Поражение.`)
    );

    haptic(win ? "medium" : "light");
    pickEnemy();
  } catch (e) {
    toast(e.message || "PvE error", "bad");
    safeText(ui.fightLog, e.message || "Ошибка");
  } finally {
    if (ui.btnPveFight) ui.btnPveFight.disabled = false;
  }
});

/* ---------- Friends ---------- */
async function loadFriends() {
  if (!ui.friends) return;
  const r = await api("/api/friends");
  const list = r.friends || [];
  ui.friends.innerHTML = "";

  if (!list.length) {
    ui.friends.innerHTML = `<div class="result">Пусто. Как в голове перед экзаменом.</div>`;
    return;
  }

  for (const f of list) {
    const row = document.createElement("div");
    row.className = "item";
    const id = f.user_id ?? f;
    const name = f.username ? `@${f.username}` : "";

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${id}</div>
        <div class="item__sub">${name}</div>
      </div>
      <button class="btn btn--secondary" data-duel="${id}">${spicy ? "⚔ РАЗБОР" : "⚔ Дуэль"}</button>
    `;

    const btn = row.querySelector("[data-duel]");
    safeClick(btn, () => {
      if (ui.pvpToId) ui.pvpToId.value = String(id);
      showTab("fight");
      toast(spicy ? "Подставил(а) друга под разъёб. Красиво." : "ID друга подставлен в PvP.", "win");
    });

    ui.friends.appendChild(row);
  }
}

safeClick(ui.btnAddFriend, async () => {
  const friend_id = Number((ui.friendInput?.value || "").trim());
  if (!friend_id) { toast("Введи ID друга, не магию.", "bad"); return; }

  try {
    ui.btnAddFriend.disabled = true;
    await api("/api/friends", { friend_id });
    ui.friendInput.value = "";
    await loadFriends();
    toast(spicy ? "Добавлено. Теперь вы соучастники." : "Друг добавлен.", "win");
    haptic("light");
  } catch (e) {
    toast(e.message || "Error", "bad");
  } finally {
    ui.btnAddFriend.disabled = false;
  }
});

/* ---------- PvP (duels) ---------- */
function pvpOutcomeText(d) {
  // если сервер уже отдаёт d.text.ru — используем
  const txt = d?.text?.ru;
  if (txt) return txt;

  // иначе локальная подпись
  if (!d.resolved) return `Открыто. Ждём, кто первый моргнёт.`;
  if (d.winner === ME?.user_id) return spicy ? "Победа. Он сам напросился." : "Победа.";
  return spicy ? "Поражение. Ну ты и лох(ушка) сегодня." : "Поражение.";
}

async function loadDuels() {
  if (!ui.duels) return;
  const r = await api("/api/duels");
  const list = r.duels || [];
  ui.duels.innerHTML = "";
  safeText(ui.pvpStatus, list.length ? String(list.length) : "—");

  for (const d of list) {
    const row = document.createElement("div");
    row.className = "item";

    const title = `#${String(d.duel_id).slice(0, 6)} · ставка ${d.stake}`;
    const sub = d.resolved ? pvpOutcomeText(d) : `от ${d.from} → ${d.to}`;

    const canAccept = (!d.resolved && d.to === ME?.user_id);

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      ${
        canAccept
          ? `<button class="btn btn--primary" data-accept="${d.duel_id}">${spicy ? "ПРИНЯТЬ И ОХУЕТЬ" : "Принять"}</button>`
          : `<div class="badge2">${d.resolved ? "RESOLVED" : "OPEN"}</div>`
      }
    `;

    ui.duels.appendChild(row);
  }

  ui.duels.querySelectorAll("[data-accept]").forEach(btn => {
    safeClick(btn, async () => {
      const duel_id = btn.getAttribute("data-accept");
      try {
        await api("/api/duel_resolve", { duel_id, lang: "ru" });
        await loadMe();
        await loadDuels();
        toast(spicy ? "Разбор закрыт. Полиция не выезжала." : "Готово.", "win");
        haptic("medium");
      } catch (e) {
        toast(e.message || "Error", "bad");
      }
    });
  });
}

safeClick(ui.btnRefreshDuels, () => loadDuels().catch(() => {}));

safeClick(ui.btnCreateDuel, async () => {
  const to_id = Number((ui.pvpToId?.value || "").trim());
  const stake = Number(ui.pvpStake?.value || 25);
  if (!to_id) { toast("Введи friend id. Не призывай пустоту.", "bad"); return; }

  try {
    ui.btnCreateDuel.disabled = true;
    safeText(ui.duelLog, spicy ? "Оформляем разбор..." : "Создаём дуэль...");
    await api("/api/duel_create", { to_id, stake });
    safeText(ui.duelLog, spicy ? "Вызов отправлен. Пусть потеет." : "Отправлено.");
    await loadDuels();
    haptic("light");
  } catch (e) {
    safeText(ui.duelLog, e.message || "Error");
    toast(e.message || "Error", "bad");
  } finally {
    ui.btnCreateDuel.disabled = false;
  }
});

/* ---------- SLOT visuals + bonus overlay ---------- */
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
  // reel0/1/2 в твоём HTML раньше были контейнерами, мы внутрь вставляем strip
  if (!elHost) return null;
  elHost.classList.add("reel"); // если стилей нет — не страшно
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
      "Мимо. Сухо. Как переписка с кафедрой.",
      "Система тебя узнала.",
      "Ну ты поняла. Ничего.",
      "В этот раз — без чудес. И без денег."
    ],
    near: [
      "НУ БЛЯДЬ. Почти.",
      "Рядом. Больно. Обидно.",
      "Так близко, что аж стыдно.",
      "Почти выиграла. Почти — ключевое слово."
    ],
    win: [
      "Норм. Живём.",
      "Окей, пошло.",
      "Ладно. Уважение.",
      "Система моргнула — тебе зашло."
    ],
    big: [
      "ЕБАТЬ. Вот это да.",
      "Красиво. Без вопросов.",
      "ВЫНОС. Плати налоги (шутка).",
      "Сейчас кто-то поверил в удачу."
    ],
    scatter: [
      "БОНУС, СУКА. Пошли сундуки.",
      "ФРИСПИНЫ? Нет. Сундуки. Ещё хуже.",
      "Началось шоу. Держись.",
      "Опа. Система дала слабину."
    ],
    bonus: [
      "Выбирай сундук. Один норм. Два — жадность.",
      "Сундуки. Лотерея для взрослых.",
      "Сейчас будет или кайф, или стыд."
    ]
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

/* ---- Bonus overlay (создаём, даже если в HTML нет) ---- */
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
      <div id="bonusTitle" style="font-weight:800; font-size:16px; margin-bottom:8px;">Бонус</div>
      <div id="bonusText" style="opacity:.85; font-size:13px; line-height:1.35; margin-bottom:12px;"></div>
      <div style="display:flex; gap:10px;">
        <button id="chestA" class="btn btn--secondary" style="flex:1;">Сундук A</button>
        <button id="chestB" class="btn btn--secondary" style="flex:1;">Сундук B</button>
        <button id="chestC" class="btn btn--secondary" style="flex:1;">Сундук C</button>
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
  if (text) text.textContent = slotJoke("bonus");
  wrap.hidden = false;

  const close = wrap.querySelector("#bonusClose");
  const a = wrap.querySelector("#chestA");
  const b = wrap.querySelector("#chestB");
  const c = wrap.querySelector("#chestC");

  const pick = (name) => {
    // локальная бонус-миниигра (без сервера) — визуал
    const roll = Math.random();
    let msg;
    if (roll < 0.25) {
      msg = spicy ? `Сундук ${name}: ПУСТО. Ну ты и верила.` : `Сундук ${name}: пусто.`;
      toast("Пусто.", "bad");
    } else if (roll < 0.80) {
      msg = spicy ? `Сундук ${name}: НОРМ. Забрала и ушла.` : `Сундук ${name}: нормально.`;
      toast("Норм.", "win");
    } else {
      msg = spicy ? `Сундук ${name}: ЛЮТЫЙ ДРОП. ЕБАТЬ.` : `Сундук ${name}: крупно!`;
      toast("КРУПНО!", "win");
    }
    if (text) text.textContent = msg;
    haptic("medium");
    setTimeout(() => { wrap.hidden = true; }, 1100);
  };

  safeClick(close, () => wrap.hidden = true);
  safeClick(a, () => pick("A"));
  safeClick(b, () => pick("B"));
  safeClick(c, () => pick("C"));
}

/* ---- Slot spin ---- */
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

  if (!initData()) {
    safeText(ui.slotComment, "Открой через Telegram кнопку в боте.");
    toast("Нет initData. Открой через кнопку 🎰.", "bad");
    spinningSlot = false;
    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;
    return;
  }

  let resp;
  try {
    resp = await api("/api/spin", {});
  } catch (e) {
    safeText(ui.slotComment, e.message || "Error");
    toast(e.message || "Error", "bad");
    spinningSlot = false;
    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;
    return;
  }

  const spin = resp.spin || {};
  const prof = resp.profile;
  if (prof) { ME = prof; syncProfileToUI(ME); }

  // анимация барабанов
  haptic("light");
  setReelTarget(reel0, spin.symbols?.[0] || "BAR", 3, 900);
  setReelTarget(reel1, spin.symbols?.[1] || "BELL", 4, 1080);
  setReelTarget(reel2, spin.symbols?.[2] || "SEVEN", 5, 1260);

  setTimeout(() => haptic("light"), 900);
  setTimeout(() => haptic("light"), 1080);
  setTimeout(() => haptic("medium"), 1260);

  setTimeout(() => {
    // нормализуем (чтобы следующий спин не улетал)
    normalizeReel(reel0, spin.symbols?.[0] || "BAR");
    normalizeReel(reel1, spin.symbols?.[1] || "BELL");
    normalizeReel(reel2, spin.symbols?.[2] || "SEVEN");

    setGlow(spin.kind || "lose");
    safeText(ui.slotComment, slotJoke(spin.kind || "lose"));
    pushHistory(spin);

    if (spin.bonus) {
      openBonusOverlay();
    }

    spinningSlot = false;
    if (ui.btnSlotSpin) ui.btnSlotSpin.disabled = false;
    if (ui.btnAuto) ui.btnAuto.disabled = false;

    if (autoMode) {
      const delay = 450 + Math.floor(Math.random() * 250);
      setTimeout(() => slotSpinOnce().catch(() => {}), delay);
    }
  }, 1350);
}

safeClick(ui.btnSlotSpin, () => slotSpinOnce().catch(() => {}));
safeClick(ui.btnAuto, () => {
  setAuto(!autoMode);
  toast(autoMode ? "Авто: ON (ну ты псих)" : "Авто: OFF", "info");
  if (autoMode) slotSpinOnce().catch(() => {});
});

/* ---------- Boot ---------- */
(function boot() {
  try {
    initTelegramUi();
    applyTopButtons();
    renderStaticText();
    pickEnemy();
    setAuto(autoMode);
    showTab("fight");

    Promise.resolve()
      .then(loadMe)
      .then(() => loadFriends().catch(() => {}))
      .then(() => loadDuels().catch(() => {}))
      .catch(e => {
        setHint(e.message || "Error");
        toast(e.message || "Error", "bad");
      });

  } catch (e) {
    // если что-то пошло не так — хотя бы показать текст
    setHint("JS упал: " + (e?.message || e));
    toast("JS упал: " + (e?.message || e), "bad");
  }
})();
