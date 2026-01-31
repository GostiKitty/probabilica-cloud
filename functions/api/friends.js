import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, addFriend, getFriends } from "../_lib/store.js";

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    await getOrCreatePlayer(env, userId, username);

    if(request.method === "GET"){
      const ids = await getFriends(env, userId);
      const out = [];

      for(const id of ids){
        const p = await getOrCreatePlayer(env, Number(id), null);
        out.push({ user_id: p.user_id, username: p.username || "" });
      }

      return json(200, { ok:true, friends: out });
    }

    if(request.method === "POST"){
      const body = await readJson(request);
      const friend_id = Number(body.friend_id || 0);
      await addFriend(env, userId, friend_id);
      return json(200, { ok:true });
    }

    return json(405, { error:"Method not allowed" });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
import { json, getInitDataFromRequest, verifyInitData, readJson } from "../_lib/auth.js";
import { getOrCreatePlayer, addFriend, getFriends } from "../_lib/store.js";

export async function onRequest({ request, env }){
  try{
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    await getOrCreatePlayer(env, userId, username);

    if(request.method === "GET"){
      const ids = await getFriends(env, userId);
      const out = [];

      for(const id of ids){
        const p = await getOrCreatePlayer(env, Number(id), null);
        out.push({ user_id: p.user_id, username: p.username || "" });
      }

      return json(200, { ok:true, friends: out });
    }

    if(request.method === "POST"){
      const body = await readJson(request);
      const friend_id = Number(body.friend_id || 0);
      await addFriend(env, userId, friend_id);
      return json(200, { ok:true });
    }

    return json(405, { error:"Method not allowed" });

  }catch(e){
    return json(401, { detail: e?.message || String(e) });
  }
}
