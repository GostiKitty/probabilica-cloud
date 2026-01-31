import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock } from "../_lib/store.js";

/* RNG */
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }

const ENEMIES = [
  { id:"electro_ded", ru:"ЭлектроДед", cn:"电爷", en:"Electro Grandpa", tier:1 },
  { id:"axisless_graph", ru:"График Без Оси", cn:"没坐标的图", en:"Axisless Graph", tier:1 },

  { id:"seedless_rng", ru:"Рандом без seed", cn:"无种随机", en:"Seedless RNG", tier:2 },
  { id:"latex_error", ru:"LaTeX Ошибка", cn:"LaTeX 报错", en:"LaTeX Error", tier:2 },

  { id:"deadline", ru:"Дедлайн", cn:"截止日期", en:"Deadline", tier:3 },
  { id:"midterm", ru:"Коллоквиум", cn:"期中考", en:"Midterm", tier:3 },

  { id:"reviewer", ru:"Рецензент", cn:"审稿人", en:"Reviewer", tier:4 },
  { id:"mpei_dean", ru:"Деканат (финальный босс)", cn:"教务处", en:"Dean Office", tier:4 },
];

function pickTierForPlayer(p){
  const lvl = Math.max(1, Number(p.level||1));
  const g = Math.max(0, Number(p.glory||0));
  // tier растёт от уровня и славы
  let tier = 1 + Math.floor((lvl-1)/3);
  if(g > 40) tier += 1;
  return clamp(tier, 1, 4);
}

function enemyForPlayer(p, enemyId){
  const tier = pickTierForPlayer(p);
  const pool = ENEMIES.filter(e=> e.tier === tier);
  let e = pool[Math.floor(Math.random()*pool.length)];

  // если игрок прислал enemy_id — это косметика. Сервер всё равно контролит tier.
  if(enemyId){
    const want = ENEMIES.find(x=> x.id === enemyId);
    if(want && want.tier === tier) e = want;
  }
  return e;
}

function fightPower(p){
  const s = p.stats || { atk:1, def:1, hp:1, luck:1 };
  return {
    atk: Number(s.atk||1),
    def: Number(s.def||1),
    hp: Number(s.hp||1),
    luck: Number(s.luck||1),
  };
}

function enemyStats(enemyTier, player){
  const base = 2 + enemyTier * 2;
  const lvl = Math.max(1, Number(player.level||1));

  return {
    atk: base + Math.floor(lvl*0.35),
    def: base + Math.floor(lvl*0.35),
    hp:  base + Math.floor(lvl*0.28),
    luck: 1 + Math.floor(enemyTier*0.7),
  };
}

function simulateFight(A, B, seed){
  const rng = mulberry32(seed);

  let aHP = 90 + A.hp * 9 + A.def * 2;
  let bHP = 90 + B.hp * 9 + B.def * 2;

  const log = [];

  for(let r=1;r<=3;r++){
    const aCrit = rng() < (0.06 + A.luck*0.004);
    const aDmg = Math.max(1, A.atk * (aCrit?1.6:1.0) + rng()*A.luck);
    bHP -= aDmg;
    log.push({ who:"you", dmg: Math.round(aDmg), crit:aCrit });
    if(bHP <= 0) return { winner:"YOU", log };

    const bCrit = rng() < (0.06 + B.luck*0.004);
    const bDmg = Math.max(1, B.atk * (bCrit?1.6:1.0) + rng()*B.luck);
    aHP -= bDmg;
    log.push({ who:"enemy", dmg: Math.round(bDmg), crit:bCrit });
    if(aHP <= 0) return { winner:"ENEMY", log };
  }

  return { winner: aHP >= bHP ? "YOU" : "ENEMY", log };
}

function levelUp(p){
  const need = (lvl)=> 50 + (lvl-1)*25;
  while(p.xp >= need(p.level||1)){
    p.xp -= need(p.level||1);
    p.level = (p.level||1) + 1;
  }
}

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if(request.method !== "POST") return json(405, { error:"Method not allowed" });

    return await withLock(env, `pve:${userId}`, 60_000, async ()=>{
      const p = await getOrCreatePlayer(env, userId, username);

      const body = await request.json().catch(()=> ({}));
      const stake = Number(body.stake || 25);
      const lang = String(body.lang || "ru");
      const enemy_id = String(body.enemy_id || "");
      const mode = String(body.mode || "match");

      if(!["ru","en","cn"].includes(lang)) return json(400, { detail:"Bad lang" });
      if(![10,25,50].includes(stake)) return json(400, { detail:"Bad stake" });

      // антиспам PvE (UX)
      const now = Date.now();
      const dt = now - (p.last_pve_ts || 0);
      if(dt < 1100) return json(429, { detail:"Тише. PvE тоже не резиновое." });
      p.last_pve_ts = now;

      if((p.coins||0) < stake) return json(400, { detail:"Не хватает монет" });

      const enemy = enemyForPlayer(p, enemy_id);
      const seed = Math.floor(Math.random()*1e9);

      const you = fightPower(p);
      const bot = enemyStats(enemy.tier, p);

      const { winner, log } = simulateFight(you, bot, seed);
      const win = winner === "YOU";

      // coins
      const deltaCoins = win ? stake : -stake;
      p.coins = (p.coins||0) + deltaCoins;

      // xp + glory
      const gainXp = (2 + enemy.tier) + (win ? (3 + enemy.tier) : 1);
      const deltaGlory = win ? (2 + enemy.tier) : -1;

      p.xp = (p.xp||0) + gainXp;
      p.glory = clamp((p.glory||0) + deltaGlory, 0, 999999);

      // streak bonuses
      if(win) p.pve_streak = (p.pve_streak||0) + 1;
      else p.pve_streak = 0;

      let streakBonus = { triggered:false, coins:0, glory:0, streak:p.pve_streak||0 };
      const s = p.pve_streak||0;
      if(win && [3,5,7].includes(s)){
        streakBonus.triggered = true;
        streakBonus.coins = 10 * enemy.tier + s;
        streakBonus.glory = 2 + enemy.tier;
        p.coins += streakBonus.coins;
        p.glory = clamp((p.glory||0) + streakBonus.glory, 0, 999999);
      }

      // daily bonus (1 раз/сутки, только за победу)
      const day = 24*60*60*1000;
      let daily = { triggered:false, coins:0, glory:0 };
      if(win){
        const last = Number(p.daily_pve_ts||0);
        if(now - last >= day){
          daily.triggered = true;
          daily.coins = 15 + enemy.tier*5;
          daily.glory = 2 + enemy.tier;
          p.coins += daily.coins;
          p.glory = clamp((p.glory||0) + daily.glory, 0, 999999);
          p.daily_pve_ts = now;
        }
      }

      levelUp(p);
      await savePlayer(env, p);

      const name =
        lang==="cn" ? enemy.cn :
        lang==="en" ? enemy.en :
        enemy.ru;

      return json(200, {
        ok:true,
        enemy: { id: enemy.id, name, tier: enemy.tier },
        result: { win, seed, stake, deltaCoins, gainXp, deltaGlory, log },
        daily,
        streakBonus,
        profile: p
      });
    });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
