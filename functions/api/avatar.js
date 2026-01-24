import {
  verifyInitData,
  json,
  readJson,
  getInitDataFromRequest
} from "../_lib/auth.js";

import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const payload = await readJson(request);
    const avatar_id = String(payload.avatar_id || "a1");

    const p = await getOrCreatePlayer(env, userId, username);
    p.avatar_id = avatar_id;
    await savePlayer(env, p);

    // Возвращаем профиль — удобно фронту
    return json(200, {
      ok: true,
      profile: {
        user_id: p.user_id,
        username: p.username,
        avatar_id: p.avatar_id,
        coins: p.coins,
        level: p.level,
        xp: p.xp,
      },
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
