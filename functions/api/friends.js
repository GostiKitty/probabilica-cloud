import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, addFriend, getFriends } from "../_lib/store.js";

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);
    await getOrCreatePlayer(env, userId, username);

    if (request.method === "GET") {
      const ids = await getFriends(env, userId);
      const friends = [];
      for (const id of ids) {
        const p = await getOrCreatePlayer(env, id, null);
        friends.push({ user_id: p.user_id, username: p.username });
      }
      return json(200, { friends });
    }

    if (request.method === "POST") {
      const body = await readJson(request);
      const friend_id = Number(body.friend_id);
      await addFriend(env, userId, friend_id);

      const ids = await getFriends(env, userId);
      const friends = [];
      for (const id of ids) {
        const p = await getOrCreatePlayer(env, id, null);
        friends.push({ user_id: p.user_id, username: p.username });
      }
      return json(200, { friends });
    }

    return json(405, { error: "Method not allowed" });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
