import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, getDuel } from "../_lib/store.js";

function randU32() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] >>> 0;
}
function makeRng(seed) {
  let x = (seed >>> 0) || 123456789;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);
    const me = await getOrCreatePlayer(env, userId, username);

    if (request.method !== "POST") return json(405, { error: "Method not allowed" });

    const body = await readJson(request);
    const duel_id = String(body.duel_id || "");
    if (!duel_id) return json(400, { error: "No duel_id" });

    const duel = await getDuel(env, duel_id);
    if (!duel) return json(404, { error: "Duel not found" });
    if (duel.resolved) return json(200, { duel, profile: me });

    if (duel.to !== userId) return json(403, { error: "Not your duel" });

    const from = await getOrCreatePlayer(env, duel.from, null);
    const to = me;

    if ((from.coins ?? 0) < duel.stake) return json(400, { error: "From has not enough coins" });
    if ((to.coins ?? 0) < duel.stake) return json(400, { error: "You have not enough coins" });

    // решаем детерминированно (seed = duel.seed + немного соли)
    const rng = makeRng((Number(duel.seed) || randU32()) ^ randU32());

    const fromScore = rng() + (Math.min(10, Number(from.level || 1)) * 0.01);
    const toScore   = rng() + (Math.min(10, Number(to.level || 1)) * 0.01);

    const winner = fromScore >= toScore ? from.user_id : to.user_id;

    // выплата: победитель забирает stake у проигравшего
    if (winner === from.user_id) {
      from.coins -= duel.stake;
      to.coins += duel.stake;
    } else {
      to.coins -= duel.stake;
      from.coins += duel.stake;
    }

    duel.resolved = true;
    duel.winner = winner;

    // сохранить duel + профили
    await env.PROB_KV.put(`duel:${duel.duel_id}`, JSON.stringify(duel));
    await savePlayer(env, from);
    await savePlayer(env, to);

    return json(200, { duel, profile: to });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
