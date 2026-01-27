import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { listDuelsForUser, getOrCreatePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  await getOrCreatePlayer(env, userId, username);

  if (request.method !== "GET") return json(405, { error: "Method not allowed" });

  const duels = await listDuelsForUser(env, userId, 30);
  return json(200, { duels });
}
