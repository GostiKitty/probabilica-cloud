/* ================== BASIC ================== */
function el(id) { return document.getElementById(id); }

/* ================== UI MAP ================== */
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
  btnRefreshDuels: el("btnRefreshDuels"),
  pvpStatus: el("pvpStatus"),

  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  btnSlotSpin: el("btnSlotSpin"),
  btnAuto: el("btnAuto"),
  slotComment: el("slotComment"),
  slotHistory: el("slotHistory"),

  toast: el("toast"),
};

/* ================== SAFE CLICK ================== */
function safeClick(el, fn) {
  if (!el) return;
  el.addEventListener("click", fn, { passive: true });
  el.addEventListener("touchstart", fn, { passive: true });
}

/* ================== TOAST ================== */
let toastTimer = null;
function toast(text, type = "info") {
  if (!ui.toast) return;
  if (toastTimer) clearTimeout(toastTimer);

  ui.toast.textContent = text;
  ui.toast.className = `toast ${type}`;
  ui.toast.hidden = false;

  toastTimer = setTimeout(() => {
    ui.toast.hidden = true;
  }, 1400);
}

/* ================== TELEGRAM ================== */
function tg() { return window.Telegram?.WebApp; }
function initData() { return tg()?.initData || ""; }

function initTelegramUi() {
  const t = tg();
  if (!t) return;
  try {
    t.ready();
    t.expand();
  } catch {}
}

function haptic(type = "light") {
  try { tg()?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

/* ================== API ================== */
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

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || data?.error || "API error");
  return data;
}

/* ================== STATE ================== */
let ME = null;
let currentStake = 25;
let LANG = "ru";

/* ================== PROFILE ================== */
function syncProfile(p) {
  ui.coins.textContent = p.coins;
  ui.level.textContent = p.level;
  ui.xp.textContent = p.xp;
  ui.glory.textContent = p.glory;
  ui.friendCode.textContent = p.user_id;
}

async function loadMe() {
  const r = await api("/api/me");
  ME = r.profile || r;
  syncProfile(ME);
}

/* ================== TABS ================== */
function showTab(name) {
  ui.panels.forEach(p => {
    p.hidden = p.dataset.panel !== name;
  });

  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(b =>
    b.classList.remove("is-active")
  );

  if (name === "fight") ui.tabFight.classList.add("is-active");
  if (name === "friends") ui.tabFriends.classList.add("is-active");
  if (name === "slot") ui.tabSlot.classList.add("is-active");
}

safeClick(ui.tabFight, () => showTab("fight"));
safeClick(ui.tabFriends, () => showTab("friends"));
safeClick(ui.tabSlot, () => showTab("slot"));

/* ================== PvE ================== */
const ENEMIES = [
  { id: "gost", name: "ГОСТ", sub: "мертв, но живёт" },
  { id: "rng", name: "Рандом без seed", sub: "ему похуй" },
  { id: "deadline", name: "Дедлайн", sub: "дышит в спину" },
];

let enemy = null;
function pickEnemy() {
  enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
  ui.enemyName.textContent = enemy.name;
  ui.enemySub.textContent = enemy.sub;
  ui.enemyHp.style.width = "100%";
}

ui.stakes.forEach(b => {
  safeClick(b, () => {
    currentStake = Number(b.dataset.stake);
    ui.stakes.forEach(x => x.classList.remove("btn--primary"));
    b.classList.add("btn--primary");
  });
});

safeClick(ui.btnPveFight, async () => {
  try {
    const r = await api("/api/pve", {
      enemy_id: enemy.id,
      stake: currentStake,
      lang: LANG,
    });

    ME = r.profile;
    syncProfile(ME);

    ui.fightLog.textContent = r.result.win
      ? `WIN +${r.result.deltaCoins}`
      : `LOSE ${r.result.deltaCoins}`;

    haptic(r.result.win ? "medium" : "light");
    pickEnemy();
  } catch (e) {
    toast(e.message, "bad");
  }
});

/* ================== FRIENDS ================== */
async function loadFriends() {
  const r = await api("/api/friends");
  ui.friends.innerHTML = "";

  if (!r.friends.length) {
    ui.friends.innerHTML = `<div class="item">Empty</div>`;
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
      <button class="btn">⚔</button>
    `;
    row.querySelector("button").onclick = () => {
      ui.pvpToId.value = f.user_id;
      showTab("fight");
    };
    ui.friends.appendChild(row);
  }
}

safeClick(ui.btnAddFriend, async () => {
  const id = Number(ui.friendInput.value);
  if (!id) return;

  try {
    await api("/api/friends", { friend_id: id });
    ui.friendInput.value = "";
    loadFriends();
    toast("Added", "win");
  } catch (e) {
    toast(e.message, "bad");
  }
});

/* ================== SLOT (минимально, живой) ================== */
safeClick(ui.btnSlotSpin, async () => {
  try {
    const r = await api("/api/spin", {});
    ME = r.profile;
    syncProfile(ME);
    ui.slotComment.textContent = r.spin.kind.toUpperCase();
    haptic("light");
  } catch (e) {
    toast(e.message, "bad");
  }
});

/* ================== BOOT ================== */
initTelegramUi();
pickEnemy();
showTab("fight");

loadMe()
  .then(loadFriends)
  .catch(e => toast(e.message, "bad"));
