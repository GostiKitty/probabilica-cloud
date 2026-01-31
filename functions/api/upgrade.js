import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock } from "../_lib/store.js";

function costFor(p){
  const lvl = Number(p.upgrade_level || 0);
  return 20 + lvl * 15;
}

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if(request.method !== "POST") return json(405, { error:"Method not allowed" });

    return await withLock(env, `upgrade:${userId}`, 60_000, async ()=>{
      const p = await getOrCreatePlayer(env, userId, username);
      const body = await readJson(request);

      const stat = String(body.stat || "").toLowerCase();
      const times = Math.max(1, Math.min(10, Number(body.times || 1)));

      if(!["atk","def","hp","luck"].includes(stat)) return json(400, { detail:"Bad stat" });

      let spent = 0;

      for(let i=0;i<times;i++){
        const c = costFor(p);
        if((p.coins||0) < c) break;
        p.coins -= c;
        spent += c;

        p.stats = p.stats || { atk:1, def:1, hp:1, luck:1 };

        // ограничения
        if(stat === "luck") p.stats.luck = Math.min(20, (p.stats.luck||1) + 1);
        if(stat === "atk") p.stats.atk = Math.min(50, (p.stats.atk||1) + 1);
        if(stat === "def") p.stats.def = Math.min(50, (p.stats.def||1) + 1);
        if(stat === "hp") p.stats.hp = Math.min(50, (p.stats.hp||1) + 1);

        p.upgrade_level = (p.upgrade_level||0) + 1;
      }

      if(spent <= 0) return json(400, { detail:"Не хватает монет. Иди бейся и страдай." });

      await savePlayer(env, p);

      return json(200, {
        ok: true,
        spentCoins: spent,
        profile: p
      });
    });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
