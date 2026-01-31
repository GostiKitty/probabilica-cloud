import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, getDuel, saveDuel, withLock } from "../_lib/store.js";

function makeRng(seed){
  let x = (seed >>> 0) || 123456789;
  return ()=> (x = (1664525*x + 1013904223)>>>0) / 4294967296;
}

function pow(p){
  const s = p.stats || { atk:1, def:1, hp:1, luck:1 };
  const lvl = Math.max(1, Number(p.level||1));
  return {
    atk: Number(s.atk||1) + lvl*0.2,
    def: Number(s.def||1) + lvl*0.2,
    hp:  Number(s.hp||1)  + lvl*0.15,
    luck:Number(s.luck||1),
    lvl
  };
}

function duelTextPack(win){
  // коротко и локально
  const RU = win
    ? ["Разъеб. Оппонент сделал вид, что у него интернет упал.", "Победа. Противник ушёл в режим «я занят».", "Чисто. Сухо. Без шансов."]
    : ["Проёб. Оппонент теперь улыбается как препод на пересдаче.", "Поражение. Система записала это в твою карму.", "Минус мораль. Плюс опыт (нет)."];

  const EN = win
    ? ["You cooked them.", "Clean win. No excuses.", "They rage-quit mentally."]
    : ["You got cooked.", "L. Tough.", "Skill issue, respectfully."];

  const CN = win
    ? ["赢麻了。", "很干净的胜利。", "对面心态爆炸。"]
    : ["输了。", "心态崩了。", "再练练。"];

  return {
    ru: { short: RU[(Math.random()*RU.length)|0] },
    en: { short: EN[(Math.random()*EN.length)|0] },
    cn: { short: CN[(Math.random()*CN.length)|0] },
  };
}

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if(request.method !== "POST") return json(405, { error:"Method not allowed" });

    const body = await readJson(request);
    const duel_id = String(body.duel_id || "");
    if(!duel_id) return json(400, { detail:"No duel_id" });

    return await withLock(env, `duel:${duel_id}`, 60_000, async ()=>{
      const me = await getOrCreatePlayer(env, userId, username);

      const duel = await getDuel(env, duel_id);
      if(!duel) return json(404, { detail:"Duel not found" });
      if(duel.resolved) return json(200, { duel, profile: me });

      if(duel.to !== userId) return json(403, { detail:"Not your duel" });

      const from = await getOrCreatePlayer(env, duel.from, null);
      const to = me;

      if((from.coins||0) < duel.stake) return json(400, { detail:"From has not enough coins" });
      if((to.coins||0) < duel.stake) return json(400, { detail:"You have not enough coins" });

      // детерминированно по seed дуэли
      const rng = makeRng(Number(duel.seed)||1);

      const A = pow(from);
      const B = pow(to);

      // шанс победы зависит от статов + чуть рандома
      const aScore = (A.atk*1.2 + A.def*0.9 + A.hp*0.6 + A.luck*0.35) + rng();
      const bScore = (B.atk*1.2 + B.def*0.9 + B.hp*0.6 + B.luck*0.35) + rng();

      const winner = aScore >= bScore ? from.user_id : to.user_id;

      // payout: победитель забирает stake
      if(winner === from.user_id){
        from.coins -= duel.stake;
        to.coins += duel.stake;
      }else{
        to.coins -= duel.stake;
        from.coins += duel.stake;
      }

      duel.resolved = true;
      duel.winner = winner;

      const winForTo = winner === to.user_id;
      duel.text = duelTextPack(winForTo);

      await saveDuel(env, duel);
      await savePlayer(env, from);
      await savePlayer(env, to);

      return json(200, { duel, profile: to });
    });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
