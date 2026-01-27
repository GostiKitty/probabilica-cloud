import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getFriends, addFriend, getOrCreatePlayer } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  await getOrCreatePlayer(env, userId, username);

  if (request.method === "GET") {
    const ids = await getFriends(env, userId);
    return json(200, { friends: ids });
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const friendId = body.friend_id;
    const ids = await addFriend(env, userId, friendId);
    return json(200, { ok: true, friends: ids });
  }

  return json(405, { error: "Method not allowed" });
}
