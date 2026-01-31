/* ================= BASIC ================= */
function el(id) { return document.getElementById(id); }
function tg() { return window.Telegram?.WebApp; }
function initData() { return tg()?.initData || ""; }
function haptic(t="light"){ try{tg()?.HapticFeedback?.impactOccurred(t);}catch{} }

/* ================= UI ================= */
const ui = {
  coins: el("coins"),
  xp: el("xp"),
  level: el("level"),
  friendCode: el("friendCode"),

  tabFight: el("tabFight"),
  tabFriends: el("tabFriends"),
  tabSlot: el("tabSlot"),
  panels: Array.from(document.querySelectorAll("[data-panel]")),

  reel0: el("reel0"),
  reel1: el("reel1"),
  reel2: el("reel2"),
  btnSlotSpin: el("btnSlotSpin"),
  slotComment: el("slotComment"),
  slotGlow: el("slotGlow"),

  bonus: el("bonus"), // контейнер бонус-игры
  bonusLog: el("bonusLog"),
};

function safeClick(el, fn){
  if(!el) return;
  el.addEventListener("click", fn);
  el.addEventListener("touchstart", fn);
}

/* ================= API ================= */
async function api(path, body){
  const r = await fetch(path,{
    method: body?"POST":"GET",
    headers:{
      "Content-Type":"application/json",
      "X-Telegram-InitData": initData()
    },
    body: body?JSON.stringify(body):undefined
  });
  const j = await r.json();
  if(!r.ok) throw new Error(j.error||"API error");
  return j;
}

/* ================= SLOT VISUAL ================= */
const ROW = 50;
const ORDER = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];

function buildReel(el){
  const strip = document.createElement("div");
  strip.className = "reel-strip";
  const rows = [];
  for(let i=0;i<ORDER.length*30;i++){
    const s = ORDER[i%ORDER.length];
    rows.push(s);
    const d = document.createElement("div");
    d.className = "sym sym-"+s;
    d.textContent = s==="SEVEN"?"7":s[0];
    strip.appendChild(d);
  }
  el.innerHTML="";
  el.appendChild(strip);
  return {strip,rows};
}

const R0 = buildReel(ui.reel0);
const R1 = buildReel(ui.reel1);
const R2 = buildReel(ui.reel2);

function spinReel(r,sym,turns,dur){
  const idxs = r.rows.map((x,i)=>x===sym?i:null).filter(x=>x!==null);
  const pick = idxs[Math.floor(Math.random()*idxs.length)];
  const y = -(pick-1)*ROW - turns*r.rows.length*ROW;
  r.strip.style.transition = `transform ${dur}ms cubic-bezier(.1,.9,.2,1)`;
  r.strip.style.transform = `translateY(${y}px)`;
}

/* ================= BONUS GAME ================= */
function startBonus(){
  ui.bonus.hidden = false;
  ui.bonusLog.textContent = "Выбери сундук. Один норм, два — жадность.";
}

window.pickChest = function(i){
  const roll = Math.random();
  let text;
  if(roll < 0.3){
    text = "ПРОЕБАЛА. Минус всё. Отличный выбор.";
  } else {
    text = "ОК. Забрала и свалила по-тихому.";
  }
  ui.bonusLog.textContent = text;
  setTimeout(()=>ui.bonus.hidden=true,1200);
};

/* ================= SLOT LOGIC ================= */
safeClick(ui.btnSlotSpin, async ()=>{
  try{
    const r = await api("/api/spin",{});
    const s = r.spin.symbols;

    spinReel(R0,s[0],3,900);
    spinReel(R1,s[1],4,1100);
    spinReel(R2,s[2],5,1300);

    setTimeout(()=>{
      ui.coins.textContent = r.profile.coins;
      ui.xp.textContent = r.profile.xp;
      ui.slotGlow.className = "slot-glow is-"+r.spin.kind;

      ui.slotComment.textContent = slotJoke(r.spin.kind);

      if(r.spin.bonus) startBonus();

      haptic(r.spin.kind==="big"?"medium":"light");
    },1350);

  }catch(e){
    alert(e.message);
  }
});

function slotJoke(k){
  const J={
    lose:["Мимо. Ну и хуй с ним.","Система тебя знает.","Не сегодня."],
    near:["БЛЯДЬ. Почти.","Обидно.","Рядом, сука."],
    win:["О, норм.","Живём.","Пойдёт."],
    big:["ЕБАТЬ.","Вот это да.","Красиво, блядь."],
    scatter:["БОНУС ПОЕХАЛ.","Началось.","Держи сундуки."]
  };
  return J[k][Math.floor(Math.random()*J[k].length)];
}
