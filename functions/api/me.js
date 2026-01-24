import {
  verifyInitData,
  json,
  getInitDataFromRequest
} from "../_lib/auth.js";

import { getOrCreatePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const p = await getOrCreatePlayer(env, userId, username);

    // Чистый профиль — ровно то, что использует frontend/app.js
    return json(200, {
      user_id: p.user_id,
      username: p.username,
      avatar_id: p.avatar_id,
      coins: p.coins,
      level: p.level,
      xp: p.xp,
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
