import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock, getBonusOffer, deleteBonusOffer } from "../_lib/store.js";

function makeRng(seed){
  let x = (seed >>> 0) || 123456789;
  return ()=> (x = (1664525*x + 1013904223)>>>0) / 4294967296;
}

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);
    if(request.method !== "POST") return json(405, { error:"Method not allowed" });

    const body = await readJson(request);
    const token = String(body.token || "");
    const choice = String(body.choice || "").toUpperCase();
    if(!token) return json(400, { detail:"No token" });
    if(!["A","B","C"].includes(choice)) return json(400, { detail:"Bad choice" });

    return await withLock(env, `bonus:${token}`, 60_000, async ()=>{
      const offer = await getBonusOffer(env, token);
      if(!offer) return json(400, { detail:"Bonus expired. Жизнь жестока." });
      if(Number(offer.user_id) !== Number(userId)) return json(403, { detail:"Not your bonus" });

      const p = await getOrCreatePlayer(env, userId, username);

      const seed = (Date.now() ^ (userId<<1) ^ choice.charCodeAt(0)) >>> 0;
      const rng = makeRng(seed);

      // награда: монеты + xp + иногда фриспины
      let coins = 0, xp = 0, free_spins = 0;

      const roll = rng();

      // три типа сундуков: один "плотный", один "норм", один "позор"
      // но выбор A/B/C не гарантирует тип — чуть рандом, чтоб было азартно.
      if(roll < 0.22){
        coins = 0;
        xp = 1;
        free_spins = 0;
      }else if(roll < 0.82){
        coins = 15 + Math.floor(rng()*20);
        xp = 2 + Math.floor(rng()*2);
        free_spins = rng() < 0.25 ? 1 : 0;
      }else{
        coins = 60 + Math.floor(rng()*70);
        xp = 6 + Math.floor(rng()*4);
        free_spins = 1 + Math.floor(rng()*2);
      }

      p.coins = (p.coins||0) + coins;
      p.xp = (p.xp||0) + xp;
      p.free_spins = (p.free_spins||0) + free_spins;

      await savePlayer(env, p);
      await deleteBonusOffer(env, token);

      const text =
        coins === 0
          ? "Пусто. Сундук улыбнулся и ушёл."
          : coins < 40
            ? "Норм. Не богато, но жить можно."
            : "ЛЮТО. Теперь не просри это в слоте за 12 секунд.";

      return json(200, {
        ok: true,
        reward: { coins, xp, free_spins },
        text,
        profile: p
      });
    });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
