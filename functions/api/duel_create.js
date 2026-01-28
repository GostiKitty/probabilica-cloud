import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, createDuel } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);
    const me = await getOrCreatePlayer(env, userId, username);

    if (request.method !== "POST") return json(405, { error: "Method not allowed" });

    const body = await readJson(request);
    const to_id = Number(body.to_id);
    const stake = Number(body.stake);

    if ((me.coins ?? 0) < stake) return json(400, { error: "Not enough coins" });

    const duel = await createDuel(env, userId, to_id, stake);
    return json(200, { duel });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
