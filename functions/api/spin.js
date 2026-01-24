import { verifyInitData, json } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";
import { WHEEL, SPIN_COST, COOLDOWN_SEC, weightedChoice, applyReward } from "../_lib/wheel.js";

export async function onRequest({ request, env }) {
  try {
    const initData = request.headers.get("X-TG-Init-Data") || "";
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const p = await getOrCreatePlayer(env, userId, username);
    const now = Math.floor(Date.now() / 1000);

    if (now - p.last_spin_ts < COOLDOWN_SEC) {
      const left = COOLDOWN_SEC - (now - p.last_spin_ts);
      return json(429, { detail: `Cooldown: ${left}s` });
    }

    if (p.coins < SPIN_COST) {
      return json(400, { detail: "Not enough coins" });
    }

    p.coins -= SPIN_COST;
    const reward = weightedChoice(WHEEL);
    const result_text = applyReward(p, reward);

    p.last_spin_ts = now;
    await savePlayer(env, p);

    return json(200, {
      reward_id: reward.id,
      result_text,
      coins: p.coins,
      level: p.level,
      xp: p.xp
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
