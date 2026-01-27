import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { createDuel, getOrCreatePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  await getOrCreatePlayer(env, userId, username);

  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const body = await request.json().catch(() => ({}));
  const duel = await createDuel(env, userId, body.to_id, body.stake);
  return json(200, { duel });
}
