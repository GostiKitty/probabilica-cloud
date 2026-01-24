import { verifyInitData, json, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = request.headers.get("X-TG-Init-Data") || "";
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const payload = await readJson(request);
    const avatar_id = String(payload.avatar_id || "a1");

    const p = await getOrCreatePlayer(env, userId, username);
    p.avatar_id = avatar_id;
    await savePlayer(env, p);

    return json(200, { ok: true, avatar_id });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
