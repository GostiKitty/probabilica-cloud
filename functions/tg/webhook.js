/* Probabilica app.js — RU only, always жёстко */

function el(id){ return document.getElementById(id); }
function q(sel){ return document.querySelector(sel); }
function qa(sel){ return Array.from(document.querySelectorAll(sel)); }

const ui = {
  subtitle: el("subtitle"),

  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  glory: el("glory"),
  friendCode: el("friendCode"),
  btnCopy: el("btnCopy"),

  tabFight: el("tabFight"),
  tabFriends: el("tabFriends"),
  tabSlot: el("tabSlot"),
  panels: qa("[data-panel]"),

  // PvE
  enemyName: el("enemyName"),
  enemySub: el("enemySub"),
  enemyHp: el("enemyHp"),
  stakes: qa(".stake"),
  btnPveFight: el("btnPveFight"),
  btnRerollEnemy: el("btnRerollEnemy"),
  fightLog: el("fightLog"),

  // Upgrade
  statLine: el("statLine"),
  upAtk: el("upAtk"),
  upDef: el("upDef"),
  upHp: el("upHp"),
  upLuck: el("upLuck"),
  upCost: el("upCost"),
  upLog: el("upLog"),

  // Friends
  friends: el("friends"),
  friendInput: el("friendInput"),
  btnAddFriend: el("btnAddFriend"),

  // PvP
  duels: el("duels"),
  pvpToId: el("pvpToId"),
  pvpStake: el("pvpStake"),
  btnCreateDuel: el("btnCreateDuel"),
  duelLog: el("duelLog"),
  btnRefreshDuels: el("btnRefreshDuels"),
  pvpStatus: el("pvpStatus"),

  // Slot
  freeSpins: el("freeSpins"),
  meter: el("meter"),
  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  payline: q(".payline"),
  slotGlow: el("slotGlow"),
  slotReels: el("slotReels"),
  btnSlotSpin: el("btnSlotSpin"),
  btnAuto: el("btnAuto"),
  slotComment: el("slotComment"),
  slotHistory: el("slotHistory"),

  hint: el("hint"),
  toast: el("toast"),
};

/* ---------- helpers ---------- */
function safeText(node, text){ if(node) node.textContent = text; }
function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

function toast(text, type="info"){
  if(!ui.toast) return;
  ui.toast.hidden = false;
  ui.toast.classList.remove("is-show","is-win","is-bad");
  if(type==="win") ui.toast.classList.add("is-win");
  if(type==="bad") ui.toast.classList.add("is-bad");
  ui.toast.textContent = text;
  ui.toast.getBoundingClientRect();
  ui.toast.classList.add("is-show");
  setTimeout(()=> {
    ui.toast.classList.remove("is-show");
    setTimeout(()=> ui.toast.hidden = true, 180);
  }, 1350);
}

function tg(){ return window.Telegram?.WebApp; }
function initData(){ return tg()?.initData || ""; }
function haptic(type="light"){ try{ tg()?.HapticFeedback?.impactOccurred?.(type);}catch{} }
function initTelegramUi(){
  try{
    tg()?.ready();
    tg()?.expand();
  }catch{}
}

async function api(path, body){
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      "Content-Type":"application/json",
      "X-Telegram-InitData": initData(),
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data;
  try{ data = JSON.parse(text); }catch{ data = { raw:text }; }
  if(!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  return data;
}

/* ---------- state ---------- */
let ME = null;
let currentStake = 25;

function syncProfile(p){
  safeText(ui.coins, String(p?.coins ?? 0));
  safeText(ui.level, String(p?.level ?? 1));
  safeText(ui.xp, String(p?.xp ?? 0));
  safeText(ui.glory, String(p?.glory ?? 0));
  safeText(ui.friendCode, String(p?.user_id ?? 0));
  safeText(ui.freeSpins, String(p?.free_spins ?? 0));
  safeText(ui.meter, String(p?.meter ?? 0));

  const s = p?.stats || { atk:1, def:1, hp:1, luck:1 };
  safeText(ui.statLine, `ATK ${s.atk} · DEF ${s.def} · HP ${s.hp} · LUCK ${s.luck}`);
  safeText(ui.upCost, String(nextUpgradeCost(p)));
}

function nextUpgradeCost(p){
  const lvl = Number(p?.upgrade_level || 0);
  return 20 + lvl * 15; // растёт, но не душит
}

async function loadMe(){
  const r = await api("/api/me");
  ME = r.profile;
  syncProfile(ME);
}

/* ---------- tabs ---------- */
function showTab(name){
  ui.panels.forEach(p => p.hidden = (p.dataset.panel !== name));
  [ui.tabFight, ui.tabFriends, ui.tabSlot].forEach(b => b?.classList.remove("is-active"));
  if(name==="fight") ui.tabFight?.classList.add("is-active");
  if(name==="friends") ui.tabFriends?.classList.add("is-active");
  if(name==="slot") ui.tabSlot?.classList.add("is-active");
}
ui.tabFight?.addEventListener("click", ()=> showTab("fight"));
ui.tabFriends?.addEventListener("click", ()=> showTab("friends"));
ui.tabSlot?.addEventListener("click", ()=> showTab("slot"));

/* ---------- copy friend code ---------- */
ui.btnCopy?.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(String(ME?.user_id || ""));
    toast("Скопировано. Теперь иди и устраивай дипломатические провокации.", "win");
  }catch{
    toast("Не скопировалось. Техника обиделась.", "bad");
  }
});

/* ---------- stakes ---------- */
ui.stakes.forEach(b=>{
  b.addEventListener("click", ()=>{
    currentStake = Number(b.dataset.stake || 25);
    ui.stakes.forEach(x => {
      x.classList.toggle("btn--primary", x===b);
      x.classList.toggle("btn--secondary", x!==b);
    });
  });
});
if(ui.stakes[1]) ui.stakes[1].click();

/* ---------- PvE enemies визуально ---------- */
let CURRENT_ENEMY = null;

function enemySubtitle(e){
  const t = e?.tier || 1;
  const names = [
    "тихий ужассс в Excel",
    "истерика по ГОСТу",
    "китайский дедлайн в 23:59",
    "диплом на коленке и злость",
    "легенда, которая тебя выебет"
  ];
  return `Tier ${t} · ${names[clamp(t-1,0,4)]}`;
}

function setEnemyCard(enemy){
  CURRENT_ENEMY = enemy;
  safeText(ui.enemyName, enemy?.name || "—");
  safeText(ui.enemySub, enemySubtitle(enemy));
  if(ui.enemyHp) ui.enemyHp.style.width = "100%";
}

/* ---------- PvE fight (по уровню сервером) ---------- */
ui.btnPveFight?.addEventListener("click", async ()=>{
  ui.btnPveFight.disabled = true;
  safeText(ui.fightLog, "Ща. Договариваемся с судьбой…");
  try{
    const r = await api("/api/pve", {
      enemy_id: CURRENT_ENEMY?.id || "",
      stake: currentStake,
      lang: "ru",
      mode: "match"
    });

    // сервер вернул актуального врага (tier/имя)
    setEnemyCard(r.enemy);

    const win = !!r.result?.win;
    if(win){
      if(ui.enemyHp) ui.enemyHp.style.width = "0%";
      haptic("medium");
      toast("ПОБЕДА. Враг ушёл плакать в WeChat.", "win");
    }else{
      if(ui.enemyHp) ui.enemyHp.style.width = "35%";
      haptic("light");
      toast("ПРОЕБ. Враг записал это в резюме.", "bad");
    }

    ME = r.profile;
    syncProfile(ME);

    // лог боя
    const dc = r.result?.deltaCoins ?? 0;
    const dx = r.result?.gainXp ?? 0;
    const dg = r.result?.deltaGlory ?? 0;

    const daily = r.daily?.triggered
      ? ` · daily +${r.daily.coins}c +${r.daily.glory}g`
      : "";

    safeText(ui.fightLog, `${win ? "WIN" : "LOSE"} · ${dc>=0?"+":""}${dc} coins · +${dx} xp · ${dg>=0?"+":""}${dg} glory${daily}`);

  }catch(e){
    safeText(ui.fightLog, e.message || "Ошибка");
    toast(e.message || "Ошибка", "bad");
  }finally{
    ui.btnPveFight.disabled = false;
  }
});

ui.btnRerollEnemy?.addEventListener("click", async ()=>{
  // Просто запросим /api/pve в режиме preview (без списания) — но чтобы не плодить эндпоинты,
  // сделаем локальную реролл-карту. Реальный враг всё равно выбирается сервером.
  const pool = [
    { id:"electro_ded", name:"ЭлектроДед", tier:1 },
    { id:"axisless_graph", name:"График Без Оси", tier:1 },
    { id:"seedless_rng", name:"Рандом без seed", tier:2 },
    { id:"latex_error", name:"LaTeX Ошибка", tier:2 },
    { id:"deadline", name:"Дедлайн", tier:3 },
    { id:"midterm", name:"Коллоквиум", tier:3 },
    { id:"reviewer", name:"Рецензент", tier:4 },
    { id:"mpei_dean", name:"Деканат (финальный босс)", tier:4 },
  ];
  const pick = pool[Math.floor(Math.random()*pool.length)];
  setEnemyCard(pick);
  toast("Сменили морду. Но от судьбы не убежишь.", "win");
});

/* ---------- Upgrade ---------- */
async function doUpgrade(stat){
  if(!stat) return;
  ui.upLog && (ui.upLog.textContent = "Покупаем силу. Дёшево, но стыдно.");
  try{
    const r = await api("/api/upgrade", { stat, times: 1 });
    ME = r.profile;
    syncProfile(ME);
    ui.upLog && (ui.upLog.textContent = `Апнуто ${stat.toUpperCase()} · -${r.spentCoins} coins. Теперь ты опаснее.`);
    toast("Прокачка прошла. Эго растёт быстрее скилла.", "win");
  }catch(e){
    ui.upLog && (ui.upLog.textContent = e.message || "Ошибка");
    toast(e.message || "Ошибка", "bad");
  }
}
ui.upAtk?.addEventListener("click", ()=> doUpgrade("atk"));
ui.upDef?.addEventListener("click", ()=> doUpgrade("def"));
ui.upHp?.addEventListener("click", ()=> doUpgrade("hp"));
ui.upLuck?.addEventListener("click", ()=> doUpgrade("luck"));

/* ---------- Friends ---------- */
async function loadFriends(){
  const r = await api("/api/friends");
  const list = r.friends || [];
  ui.friends.innerHTML = "";

  if(!list.length){
    ui.friends.innerHTML = `<div class="result">Пока пусто. Как надежды на «быстро диплом».</div>`;
    return;
  }

  for(const f of list){
    const row = document.createElement("div");
    row.className = "item";
    const title = `${f.user_id}`;
    const sub = f.username ? `@${f.username}` : "без ника, но с характером";

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title mono">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      <button class="btn btn--secondary" data-duel="${f.user_id}">ДУЭЛЬ</button>
    `;
    ui.friends.appendChild(row);
  }

  ui.friends.querySelectorAll("[data-duel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-duel");
      ui.pvpToId.value = String(id);
      showTab("fight");
      toast("Подставила friend id. Осталось только не обосраться.", "win");
    });
  });
}

ui.btnAddFriend?.addEventListener("click", async ()=>{
  const friend_id = Number((ui.friendInput.value||"").trim());
  if(!friend_id) return;

  ui.btnAddFriend.disabled = true;
  try{
    await api("/api/friends", { friend_id });
    ui.friendInput.value = "";
    await loadFriends();
    toast("Друг добавлен. Теперь можно официально устраивать разборки.", "win");
  }catch(e){
    toast(e.message || "Ошибка", "bad");
  }finally{
    ui.btnAddFriend.disabled = false;
  }
});

/* ---------- Duels ---------- */
function duelLineText(d){
  if(!d) return "—";
  if(!d.resolved){
    return `OPEN · ${d.from} → ${d.to}`;
  }
  const t = d.text?.ru?.short || `RESOLVED · winner ${d.winner}`;
  return t;
}

async function loadDuels(){
  const r = await api("/api/duels");
  const list = r.duels || [];
  ui.duels.innerHTML = "";
  safeText(ui.pvpStatus, list.length ? String(list.length) : "—");

  for(const d of list){
    const row = document.createElement("div");
    row.className = "item";

    const title = `#${String(d.duel_id).slice(0,6)} · stake ${d.stake}`;
    const sub = duelLineText(d);
    const canAccept = (!d.resolved && d.to === ME?.user_id);

    row.innerHTML = `
      <div class="item__main">
        <div class="item__title">${title}</div>
        <div class="item__sub">${sub}</div>
      </div>
      ${
        canAccept
          ? `<button class="btn btn--primary" data-accept="${d.duel_id}">ПРИНЯТЬ И ВЫЖИТЬ</button>`
          : `<div class="badge2">${d.resolved ? "RESOLVED" : "OPEN"}</div>`
      }
    `;
    ui.duels.appendChild(row);
  }

  ui.duels.querySelectorAll("[data-accept]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const duel_id = btn.getAttribute("data-accept");
      btn.disabled = true;
      try{
        const r = await api("/api/duel_resolve", { duel_id });
        ME = r.profile;
        syncProfile(ME);
        await loadDuels();
        toast("Разбор закрыт. Комиссия — твоя гордость.", "win");
      }catch(e){
        toast(e.message || "Ошибка", "bad");
      }finally{
        btn.disabled = false;
      }
    });
  });
}

ui.btnRefreshDuels?.addEventListener("click", ()=> loadDuels().catch(()=>{}));

ui.btnCreateDuel?.addEventListener("click", async ()=>{
  const to_id = Number((ui.pvpToId.value||"").trim());
  const stake = Number(ui.pvpStake.value||25);
  if(!to_id) return;

  ui.btnCreateDuel.disabled = true;
  safeText(ui.duelLog, "Оформляем разбор… юридически сомнительно, но красиво.");
  try{
    await api("/api/duel_create", { to_id, stake });
    safeText(ui.duelLog, "Вызов отправлен. Ждём, когда у человека закончится стыд.");
    await loadDuels();
    toast("Отправлено.", "win");
  }catch(e){
    safeText(ui.duelLog, e.message || "Ошибка");
    toast(e.message || "Ошибка", "bad");
  }finally{
    ui.btnCreateDuel.disabled = false;
  }
});

/* ---------- SLOT: icons + real spin ---------- */
const ICON = {
  BAR: "🧱",
  BELL: "🔔",
  SEVEN: "7️⃣",
  CHERRY: "🍒",
  STAR: "✨",
  COIN: "🪙",
  SCATTER: "🧧", // CN-мем
};

const ORDER = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];
const ROW_H = 50;

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = (Math.random()*(i+1))|0;
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function ensureStrip(host){
  let strip = host.querySelector(".reel-strip");
  if(!strip){
    strip = document.createElement("div");
    strip.className = "reel-strip";
    host.innerHTML = "";
    host.appendChild(strip);
  }
  return strip;
}

function buildReel(host){
  const strip = ensureStrip(host);
  const rows = [];
  strip.innerHTML = "";

  // делаем ленту не тупо повтором, а "пачками" с шифтом
  const packs = 42;
  for(let p=0;p<packs;p++){
    const pack = shuffle(ORDER);
    for(const sym of pack){
      rows.push(sym);
      const d = document.createElement("div");
      d.className = "sym";
      d.innerHTML = `<span>${ICON[sym] || sym}</span>`;
      strip.appendChild(d);
    }
  }
  return { host, strip, rows };
}

const R0 = buildReel(ui.reel0);
const R1 = buildReel(ui.reel1);
const R2 = buildReel(ui.reel2);

function pickIndex(rows, sym){
  const idx = [];
  for(let i=0;i<rows.length;i++) if(rows[i]===sym) idx.push(i);
  return idx[(Math.random()*idx.length)|0] || 0;
}

function spinReel(reel, sym, turns, ms){
  const i = pickIndex(reel.rows, sym);
  const centerRow = 1;
  const base = (i - centerRow) * ROW_H;
  const travel = turns * reel.rows.length * ROW_H;
  const y = -(base + travel);

  reel.host.classList.add("is-spinning");
  reel.strip.style.transition = `transform ${ms}ms cubic-bezier(.12,.92,.2,1)`;
  reel.strip.style.transform = `translateY(${y}px)`;
}

function settleReel(reel, sym){
  const i = pickIndex(reel.rows, sym);
  const centerRow = 1;
  const base = (i - centerRow) * ROW_H;

  // bounce: чуть перелетели и вернули
  reel.strip.style.transition = "none";
  reel.strip.style.transform = `translateY(${-base - 8}px)`;
  reel.strip.getBoundingClientRect();

  reel.strip.style.transition = "transform 120ms ease-out";
  reel.strip.style.transform = `translateY(${-base}px)`;
  setTimeout(()=> reel.host.classList.remove("is-spinning"), 160);
}

function glow(kind){
  ui.slotGlow?.classList.remove("is-win","is-big","is-bonus");
  ui.payline?.classList.remove("is-hit");

  if(kind==="win" || kind==="near"){
    ui.slotGlow?.classList.add("is-win");
  }
  if(kind==="big"){
    ui.slotGlow?.classList.add("is-big");
    ui.slotReels?.classList.add("is-win");
    setTimeout(()=> ui.slotReels?.classList.remove("is-win"), 520);
  }
  if(kind==="scatter"){
    ui.slotGlow?.classList.add("is-bonus");
  }
  if(kind==="win" || kind==="big" || kind==="scatter"){
    ui.payline?.classList.add("is-hit");
  }
}

function slotJoke(kind){
  const pack = {
    lose: [
      "Мимо. Как мои планы «лечь пораньше».",
      "Система: «нет». Ты: «ладно…»",
      "Сухо. Даже судьба не лайкнула."
    ],
    near: [
      "НУ БЛЯДЬ. Почти.",
      "Рядом. Больно. Привычно.",
      "Так близко, что хочется подать жалобу в деканат."
    ],
    win: [
      "Норм. Живём.",
      "Окей. Сегодня ты не статист.",
      "Хорошо. Но не выёбывайся."
    ],
    big: [
      "ЕБАТЬ, КРУПНО.",
      "Красиво. Чисто. Без оправданий.",
      "ВЫНОС. Ставь на диплом (не ставь)."
    ],
    scatter: [
      "БОНУС. Погнали вскрывать сундук судьбы.",
      "Опа. Вселенная дала слабину.",
      "Сейчас будет риск и моральная травма."
    ],
  };
  const a = pack[kind] || pack.lose;
  return a[(Math.random()*a.length)|0];
}

function pushHistory(spin){
  const row = document.createElement("div");
  row.className = "item";
  const sym = (spin.symbols||[]).map(s=> ICON[s] || s).join(" · ");
  const badge = String(spin.kind||"—").toUpperCase();
  row.innerHTML = `
    <div class="item__main">
      <div class="item__title">${sym}</div>
      <div class="item__sub">+${spin.winCoins||0} монет • +${spin.winXp||0} xp</div>
    </div>
    <div class="badge2">${badge}</div>
  `;
  ui.slotHistory.prepend(row);
  while(ui.slotHistory.children.length>6) ui.slotHistory.lastChild.remove();
}

/* ----- Bonus overlay (server-authoritative) ----- */
function ensureBonus(){
  let wrap = document.getElementById("bonusOverlay");
  if(wrap) return wrap;

  wrap = document.createElement("div");
  wrap.id = "bonusOverlay";
  wrap.hidden = true;
  wrap.style.position = "fixed";
  wrap.style.inset = "0";
  wrap.style.zIndex = "99999";
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "center";
  wrap.style.background = "rgba(0,0,0,.58)";
  wrap.style.backdropFilter = "blur(8px)";

  wrap.innerHTML = `
    <div style="
      width:min(380px,92vw);
      border-radius:18px;
      background:#0b0b0b;
      border:1px solid rgba(255,255,255,.12);
      box-shadow: 0 18px 60px rgba(0,0,0,.75);
      padding:14px;
    ">
      <div style="font-weight:900; font-size:16px; margin-bottom:6px;">🎁 Сундук судьбы</div>
      <div id="bTxt" style="opacity:.85; font-size:13px; line-height:1.35; margin-bottom:12px;">
        Выбирай один. Остальные будут сниться.
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn--secondary" id="bA" style="flex:1;">A</button>
        <button class="btn btn--secondary" id="bB" style="flex:1;">B</button>
        <button class="btn btn--secondary" id="bC" style="flex:1;">C</button>
      </div>
      <div style="display:flex; justify-content:flex-end; margin-top:10px;">
        <button class="btn btn--secondary" id="bClose">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
  return wrap;
}

async function openBonus(token){
  const wrap = ensureBonus();
  const txt = wrap.querySelector("#bTxt");
  const close = wrap.querySelector("#bClose");
  const A = wrap.querySelector("#bA");
  const B = wrap.querySelector("#bB");
  const C = wrap.querySelector("#bC");

  let busy = false;
  const pick = async (choice)=>{
    if(busy) return;
    busy = true;
    try{
      txt.textContent = "Вскрываем… если сейчас выпадет позор — я не виновата.";
      const r = await api("/api/bonus_pick", { token, choice });
      ME = r.profile;
      syncProfile(ME);

      const rew = r.reward;
      txt.textContent = `Сундук ${choice}: +${rew.coins} монет, +${rew.xp} xp, +${rew.free_spins} фриспинов. ${r.text}`;
      haptic("medium");
      toast("Бонус получен. Теперь не плачь.", "win");
      setTimeout(()=> wrap.hidden = true, 1400);
    }catch(e){
      txt.textContent = e.message || "Ошибка";
      toast(e.message || "Ошибка", "bad");
      busy = false;
    }
  };

  A.onclick = ()=> pick("A");
  B.onclick = ()=> pick("B");
  C.onclick = ()=> pick("C");
  close.onclick = ()=> wrap.hidden = true;

  wrap.hidden = false;
}

/* ---------- Slot spin ---------- */
let spinning = false;
let autoMode = localStorage.getItem("auto")==="1";

function setAuto(v){
  autoMode = !!v;
  localStorage.setItem("auto", autoMode ? "1" : "0");
  ui.btnAuto?.classList.toggle("btn--primary", autoMode);
  ui.btnAuto?.classList.toggle("btn--secondary", !autoMode);
}

async function slotSpinOnce(){
  if(spinning) return;
  spinning = true;
  ui.btnSlotSpin.disabled = true;
  ui.btnAuto.disabled = true;

  try{
    const r = await api("/api/spin", {});
    const spin = r.spin || {};
    ME = r.profile;
    syncProfile(ME);

    // анимация
    spinReel(R0, spin.symbols?.[0] || "BAR", 3, 900);
    spinReel(R1, spin.symbols?.[1] || "BELL", 4, 1050);
    spinReel(R2, spin.symbols?.[2] || "SEVEN", 5, 1200);

    setTimeout(()=> haptic("light"), 900);
    setTimeout(()=> haptic("light"), 1050);
    setTimeout(()=> haptic("medium"), 1200);

    setTimeout(()=>{
      settleReel(R0, spin.symbols?.[0] || "BAR");
      settleReel(R1, spin.symbols?.[1] || "BELL");
      settleReel(R2, spin.symbols?.[2] || "SEVEN");

      glow(spin.kind || "lose");
      ui.slotComment.textContent = slotJoke(spin.kind || "lose");
      pushHistory(spin);

      if(spin.bonus_offer?.token){
        openBonus(spin.bonus_offer.token).catch(()=>{});
      }

      spinning = false;
      ui.btnSlotSpin.disabled = false;
      ui.btnAuto.disabled = false;

      if(autoMode){
        setTimeout(()=> slotSpinOnce().catch(()=>{}), 520);
      }
    }, 1320);

  }catch(e){
    ui.slotComment.textContent = e.message || "Ошибка";
    toast(e.message || "Ошибка", "bad");
    spinning = false;
    ui.btnSlotSpin.disabled = false;
    ui.btnAuto.disabled = false;
  }
}

ui.btnSlotSpin?.addEventListener("click", ()=> slotSpinOnce().catch(()=>{}));
ui.btnAuto?.addEventListener("click", ()=>{
  setAuto(!autoMode);
  toast(autoMode ? "Авто: ON. Ты реально псих." : "Авто: OFF.", "win");
  if(autoMode) slotSpinOnce().catch(()=>{});
});

/* ---------- boot ---------- */
async function boot(){
  initTelegramUi();
  safeText(ui.subtitle, "Лобби");
  setAuto(autoMode);

  // стартовая визуальная морда
  setEnemyCard({ id:"seedless_rng", name:"Рандом без seed", tier:2 });

  try{
    await loadMe();
    await loadFriends().catch(()=>{});
    await loadDuels().catch(()=>{});
  }catch(e){
    ui.hint.textContent = e.message || "Ошибка";
    toast(e.message || "Ошибка", "bad");
  }
}
boot();
