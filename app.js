/* Probabilica app.js (frontend) */

function el(id) { return document.getElementById(id); }

/* ================= UI ================= */
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

  btnPveFight: el("btnPveFight"),
  fightLog: el("fightLog"),
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyHp: el("enemyHp"),
  stakes: Array.from(document.querySelectorAll(".stake")),

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

/* ================= TOAST ================= */
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

/* ================= TELEGRAM ================= */
function tg() { return window.Telegram?.WebApp; }
function initData() { return tg()?.initData || ""; }

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

function haptic(type = "light") {
  try { tg()?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

/* ================= API ================= */
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

/* ================= STATE ================= */
let ME = null;
let currentStake = 25;

/* ================= PROFILE ================= */
function syncProfileToUI(p) {
  ui.coins.textContent = p.coins ?? 0;
  ui.level.textContent = p.level ?? 1;
  ui.xp.textContent = p.xp ?? 0;
  ui.glory.textContent = p.glory ?? 0;
  ui.friendCode.textContent = p.user_id ?? 0;
  ui.freeSpins.textContent = p.free_spins ?? 0;
  ui.meter.textContent = p.meter ?? 0;
}

async function loadMe() {
  const r = await api("/api/me");
  ME = r.profile || r;
  syncProfileToUI(ME);
}

/* ================= PvE ================= */
const ENEMIES = [
  { id: "gost", name: "ГОСТ", sub: "мертв, но живёт" },
  { id: "rng", name: "Рандом без seed", sub: "ему похуй" },
  { id: "deadline", name: "Дедлайн", sub: "дышит в спину" },
  { id: "review", name: "Ревьюер", sub: "просит переписать всё" },
];

let enemy = null;
function pickEnemy() {
  enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  ui.enemyName.textContent = enemy.name;
  ui.enemySub.textContent = enemy.sub;
  ui.enemyHp.style.width = "100%";
}
pickEnemy();

ui.stakes.forEach(b => {
  b.onclick = () => {
    currentStake = Number(b.dataset.stake);
    ui.stakes.forEach(x => x.classList.toggle("btn--primary", x === b));
    ui.stakes.forEach(x => x.classList.toggle("btn--secondary", x !== b));
  };
});
ui.stakes[1]?.click();

ui.btnPveFight.onclick = async () => {
  if (!initData()) {
    toast("Open in Telegram", "bad");
    return;
  }

  try {
    const r = await api("/api/pve", {
      enemy_id: enemy.id,
      stake: currentStake,
      lang: LANG,
    });

    ME = r.profile;
    syncProfileToUI(ME);

    ui.enemyName.textContent = `${r.enemy.name} [T${r.enemy.tier}]`;
    ui.fightLog.textContent = r.result.win
      ? `WIN +${r.result.deltaCoins}`
      : `LOSE ${r.result.deltaCoins}`;

    if (r.daily) toast(`Daily +${r.daily.coins}`, "win");

    haptic(r.result.win ? "medium" : "light");
    pickEnemy();
  } catch (e) {
    toast(e.message, "bad");
  }
};

/* ================= FRIENDS ================= */
async function loadFriends() {
  const r = await api("/api/friends");
  ui.friends.innerHTML = "";

  if (!r.friends.length) {
    ui.friends.innerHTML = `<div class="result">Пока пусто.</div>`;
    return;
  }

  for (const f of r.friends) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${f.user_id}</div>
        <div class="item__sub">${f.username || ""}</div>
      </div>
      <button class="btn btn--secondary">⚔</button>
    `;
    row.querySelector("button").onclick = () => {
      ui.pvpToId.value = f.user_id;
      showTab("fight");
    };
    ui.friends.appendChild(row);
  }
}

ui.btnAddFriend.onclick = async () => {
  const id = Number(ui.friendInput.value);
  if (!id) return;

  try {
    await api("/api/friends", { friend_id: id });
    ui.friendInput.value = "";
    await loadFriends();
    toast("Добавлено", "win");
  } catch (e) {
    toast(e.message, "bad");
  }
};

/* ================= DUELS ================= */
async function loadDuels() {
  const r = await api("/api/duels");
  ui.duels.innerHTML = "";
  ui.pvpStatus.textContent = r.duels.length || "—";

  for (const d of r.duels) {
    const row = document.createElement("div");
    row.className = "item";

    const text = d.resolved
      ? d.text?.[LANG] || "DONE"
      : `from ${d.from} → ${d.to}`;

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">#${d.duel_id.slice(0, 6)} · ${d.stake}</div>
        <div class="item__sub">${text}</div>
      </div>
      ${
        !d.resolved && d.to === ME.user_id
          ? `<button class="btn btn--primary">Accept</button>`
          : `<div class="badge2">${d.resolved ? "DONE" : "WAIT"}</div>`
      }
    `;

    if (!d.resolved && d.to === ME.user_id) {
      row.querySelector("button").onclick = async () => {
        await api("/api/duel_resolve", { duel_id: d.duel_id, lang: LANG });
        await loadMe();
        await loadDuels();
        toast("Resolved", "win");
      };
    }

    ui.duels.appendChild(row);
  }
}

ui.btnRefreshDuels.onclick = () => loadDuels();

/* ================= BOOT ================= */
initTelegramUi();
pickEnemy();

loadMe()
  .then(loadFriends)
  .then(loadDuels)
  .catch(e => {
    setHint(e.message);
    toast(e.message, "bad");
  });
