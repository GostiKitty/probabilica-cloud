import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);
    const p = await getOrCreatePlayer(env, userId, username);

    if (request.method !== "POST") return json(405, { error: "Method not allowed" });

    const body = await request.json().catch(() => ({}));
    const avatar_id = String(body.avatar_id || "").trim();
    if (!avatar_id.startsWith("char|")) return json(400, { error: "Bad avatar_id" });

    p.avatar_id = avatar_id;
    await savePlayer(env, p);

    return json(200, { ok: true, avatar_id: p.avatar_id });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
