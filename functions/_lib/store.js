export function playerKey(userId) {
  return `player:${userId}`;
}

export async function getOrCreatePlayer(env, userId, username) {
  const key = playerKey(userId);
  let p = await env.PROB_KV.get(key, "json");

  if (!p) {
    p = {
      user_id: userId,
      username: username || `user${userId}`,
      avatar_id: "a1",
      coins: 150,
      level: 1,
      xp: 0,
      last_spin_ts: 0
    };
    await env.PROB_KV.put(key, JSON.stringify(p));
    return p;
  }

  // обновим username
  if (username && p.username !== username) {
    p.username = username;
    await env.PROB_KV.put(key, JSON.stringify(p));
  }
  return p;
}

export async function savePlayer(env, p) {
  await env.PROB_KV.put(playerKey(p.user_id), JSON.stringify(p));
}
