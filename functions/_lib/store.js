export function playerKey(userId) {
  return `player:${userId}`;
}
function friendsKey(userId) {
  return `friends:${userId}`;
}
function duelKey(duelId) {
  return `duel:${duelId}`;
}

export async function getOrCreatePlayer(env, userId, username) {
  const key = playerKey(userId);
  let p = await env.PROB_KV.get(key, "json");

  if (!p) {
    p = {
      user_id: userId,
      username: username || `user${userId}`,
      avatar_id: "char|str=1|def=1|int=1|luck=1",
      coins: 150,
      level: 1,
      xp: 0,
      free_spins: 0,
      meter: 0,
      bonus_until: 0,
      last_spin_ts: 0,
    };
    await env.PROB_KV.put(key, JSON.stringify(p));
    return p;
  }

  // миграции/дефолты
  if (p.free_spins == null) p.free_spins = 0;
  if (p.meter == null) p.meter = 0;
  if (p.bonus_until == null) p.bonus_until = 0;
  if (p.last_spin_ts == null) p.last_spin_ts = 0;
  if (p.avatar_id == null) p.avatar_id = "char|str=1|def=1|int=1|luck=1";
  if (p.coins == null) p.coins = 150;
  if (p.level == null) p.level = 1;
  if (p.xp == null) p.xp = 0;

  if (username && p.username !== username) {
    p.username = username;
    await env.PROB_KV.put(key, JSON.stringify(p));
  }
  return p;
}

export async function savePlayer(env, p) {
  await env.PROB_KV.put(playerKey(p.user_id), JSON.stringify(p));
}

/* ---------------- FRIENDS ---------------- */

export async function getFriends(env, userId) {
  const list = await env.PROB_KV.get(friendsKey(userId), "json");
  return Array.isArray(list) ? list : [];
}

export async function addFriend(env, userId, friendId) {
  friendId = Number(friendId);
  if (!Number.isFinite(friendId) || friendId <= 0) throw new Error("Bad friend_id");
  if (friendId === userId) throw new Error("Cannot add yourself");

  const list = await getFriends(env, userId);
  if (!list.includes(friendId)) {
    list.push(friendId);
    await env.PROB_KV.put(friendsKey(userId), JSON.stringify(list));
  }

  const list2 = await getFriends(env, friendId);
  if (!list2.includes(userId)) {
    list2.push(userId);
    await env.PROB_KV.put(friendsKey(friendId), JSON.stringify(list2));
  }

  return list;
}

/* ---------------- DUELS ---------------- */

function randId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export async function createDuel(env, fromId, toId, stake) {
  toId = Number(toId);
  stake = Number(stake);

  if (!Number.isFinite(toId) || toId <= 0) throw new Error("Bad to_id");
  if (toId === fromId) throw new Error("Cannot duel yourself");
  if (![10, 25, 50].includes(stake)) throw new Error("Bad stake");

  const duelId = randId();

  const duel = {
    duel_id: duelId,
    from: fromId,
    to: toId,
    stake,
    created_ts: Date.now(),
    resolved: false,
    winner: null,
  };

  await env.PROB_KV.put(duelKey(duelId), JSON.stringify(duel));
  return duel;
}

export async function getDuel(env, duelId) {
  return await env.PROB_KV.get(duelKey(duelId), "json");
}

export async function listDuelsForUser(env, userId, limit = 30) {
  const duels = [];
  let cursor = undefined;

  while (duels.length < limit) {
    const page = await env.PROB_KV.list({ prefix: "duel:", cursor });
    cursor = page.cursor;

    for (const k of page.keys) {
      const d = await env.PROB_KV.get(k.name, "json");
      if (!d) continue;
      if (d.from === userId || d.to === userId) duels.push(d);
      if (duels.length >= limit) break;
    }

    if (!cursor) break;
  }

  duels.sort((a, b) => (b.created_ts || 0) - (a.created_ts || 0));
  return duels.slice(0, limit);
}
