import {
  verifyInitData,
  json,
  getInitDataFromRequest
} from "../_lib/auth.js";

import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";
import {
  WHEEL,
  SPIN_COST,
  COOLDOWN_SEC,
  weightedChoice,
  applyReward
} from "../_lib/wheel.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
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

    // ВАЖНО: формат под твой frontend/app.js
    return json(200, {
      text: result_text,
      profile: {
        user_id: p.user_id,
        username: p.username,
        avatar_id: p.avatar_id,
        coins: p.coins,
        level: p.level,
        xp: p.xp,
      },
      reward_id: reward.id,
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
