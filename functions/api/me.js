import { verifyInitData, json } from "../_lib/auth.js";
import { getOrCreatePlayer } from "../_lib/store.js";
import { WHEEL, SPIN_COST, COOLDOWN_SEC } from "../_lib/wheel.js";

export async function onRequest({ request, env }) {
  try {
    const initData = request.headers.get("X-TG-Init-Data") || "";
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const p = await getOrCreatePlayer(env, userId, username);

    return json(200, {
      user_id: p.user_id,
      username: p.username,
      avatar_id: p.avatar_id,
      coins: p.coins,
      level: p.level,
      xp: p.xp,
      wheel: WHEEL.map(r => ({ id: r.id, label: r.label })),
      spin_cost: SPIN_COST,
      cooldown: COOLDOWN_SEC
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
