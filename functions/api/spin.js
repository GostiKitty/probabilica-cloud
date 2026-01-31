import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock, createBonusOffer } from "../_lib/store.js";
import { spinSlot } from "../_lib/wheel.js";

function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
function randU32(){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]>>>0; }

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if(request.method !== "POST") return json(405, { error:"Method not allowed" });

    return await withLock(env, `spin:${userId}`, 60_000, async ()=>{
      const p = await getOrCreatePlayer(env, userId, username);

      // мягкий антиспам (чтобы UX был норм)
      const now = Date.now();
      const hasFree = (p.free_spins ?? 0) > 0;
      if(!hasFree){
        const dt = now - (p.last_spin_ts || 0);
        if(dt < 950) return json(429, { detail:"Тише, чемпион. Не дрочи кнопку." });
      }

      // ставка за спин
      if(hasFree){
        p.free_spins = Math.max(0, (p.free_spins||0) - 1);
      }else{
        if((p.coins||0) < 5) return json(400, { detail:"Не хватает монет. Иди в PvE страдать." });
        p.coins -= 5;
        p.last_spin_ts = now;
      }

      // pity system (НЕ «подкрутка», а анти-фрустрация)
      p.stats_meta = p.stats_meta || { spins:0, wins:0, loss_streak:0 };

      const luck = clamp(Number(p.stats?.luck || 1), 1, 20);
      const bonusMode = (p.bonus_until || 0) > now;

      // если длинная серия лузов — слегка поднимаем шанс хорошего исхода
      const ls = Number(p.stats_meta.loss_streak || 0);
      const luckBoost = ls >= 6 ? 3 : ls >= 4 ? 2 : ls >= 2 ? 1 : 0;

      const seed = randU32();
      const spin = spinSlot({ seed, luck: clamp(luck + luckBoost, 1, 20), bonusMode });

      // награды
      p.coins = (p.coins||0) + (spin.winCoins||0);
      p.xp = (p.xp||0) + (spin.winXp||0);

      // meter
      p.meter = clamp((p.meter||0) + (spin.kind === "lose" ? 1 : 2), 0, 10);

      let meter_triggered = false;
      if(p.meter >= 10){
        p.meter = 0;
        p.free_spins = (p.free_spins||0) + 3;
        meter_triggered = true;
      }

      // scatter -> free spins + bonus offer
      let bonus_offer = null;
      if(spin.kind === "scatter"){
        p.free_spins = (p.free_spins||0) + 2;
        bonus_offer = await createBonusOffer(env, p.user_id, { base: "scatter" });
      }

      // big -> короткий бонус режим
      if(spin.kind === "big"){
        p.bonus_until = now + 2*60*1000;
      }

      // stat tracking
      p.stats_meta.spins = (p.stats_meta.spins||0) + 1;
      if(spin.kind === "win" || spin.kind === "big"){
        p.stats_meta.wins = (p.stats_meta.wins||0) + 1;
        p.stats_meta.loss_streak = 0;
      }else{
        p.stats_meta.loss_streak = (p.stats_meta.loss_streak||0) + 1;
      }

      await savePlayer(env, p);

      return json(200, {
        spin: {
          ...spin,
          meter_triggered,
          bonus_until: p.bonus_until || 0,
          bonus_offer,
        },
        profile: p
      });
    });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
