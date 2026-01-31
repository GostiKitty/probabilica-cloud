export function playerKey(userId) {
  return `player:${userId}`;
}
function friendsKey(userId) {
  return `friends:${userId}`;
}
function duelKey(duelId) {
  return `duel:${duelId}`;
}

/* ================= LOCK ================= */
export async function withLock(env, key, ttlMs, fn) {
  const lockKey = `lock:${key}`;
  if (await env.PROB_KV.get(lockKey)) {
    throw new Error("Locked");
  }

  await env.PROB_KV.put(lockKey, "1", {
    expirationTtl: Math.ceil(ttlMs / 1000),
  });

  try {
    return await fn();
  } finally {
    await env.PROB_KV.delete(lockKey);
  }
}

/* ================= PLAYER ================= */
export async function getOrCreatePlayer(env, userId, username) {
  let p = await env.PROB_KV.get(playerKey(userId), "json");

  if (!p) {
    p = {
      user_id: userId,
      username: username || `user${userId}`,

      avatar_id: "char|neo",
      coins: 150,
      level: 1,
      xp: 0,
      glory: 0,

      free_spins: 0,
      meter: 0,
      bonus_until: 0,
      last_spin_ts: 0,

      daily_pve_ts: 0,
      pve_streak: 0,
    };
    await env.PROB_KV.put(playerKey(userId), JSON.stringify(p));
    return p;
  }

  // миграции
  if (p.glory == null) p.glory = 0;
  if (p.free_spins == null) p.free_spins = 0;
  if (p.meter == null) p.meter = 0;
  if (p.bonus_until == null) p.bonus_until = 0;
  if (p.last_spin_ts == null) p.last_spin_ts = 0;
  if (p.daily_pve_ts == null) p.daily_pve_ts = 0;
  if (p.pve_streak == null) p.pve_streak = 0;

  if (username && p.username !== username) {
    p.username = username;
    await env.PROB_KV.put(playerKey(userId), JSON.stringify(p));
  }

  return p;
}

export async function savePlayer(env, p) {
  await env.PROB_KV.put(playerKey(p.user_id), JSON.stringify(p));
}

/* ================= FRIENDS ================= */
export async function getFriends(env, userId) {
  return (await env.PROB_KV.get(friendsKey(userId), "json")) || [];
}

export async function addFriend(env, userId, friendId) {
  friendId = Number(friendId);
  if (!friendId || friendId === userId) throw new Error("Bad friend");

  const a = await getFriends(env, userId);
  const b = await getFriends(env, friendId);

  if (!a.includes(friendId)) a.push(friendId);
  if (!b.includes(userId)) b.push(userId);

  await env.PROB_KV.put(friendsKey(userId), JSON.stringify(a));
  await env.PROB_KV.put(friendsKey(friendId), JSON.stringify(b));
}

/* ================= DUELS ================= */
function randId() {
  return crypto.randomUUID();
}

export async function createDuel(env, from, to, stake) {
  if (![10, 25, 50].includes(stake)) throw new Error("Bad stake");
  if (from === to) throw new Error("Self duel");

  const duel = {
    duel_id: randId(),
    from,
    to,
    stake,
    seed: Math.floor(Math.random() * 1e9),
    created_ts: Date.now(),
    resolved: false,
    winner: null,
    text: {},
  };

  await env.PROB_KV.put(duelKey(duel.duel_id), JSON.stringify(duel));
  return duel;
}

export async function getDuel(env, id) {
  return await env.PROB_KV.get(duelKey(id), "json");
}

export async function listDuelsForUser(env, userId, limit = 20) {
  const it = await env.PROB_KV.list({ prefix: "duel:" });
  const out = [];

  for (const k of it.keys) {
    const d = await env.PROB_KV.get(k.name, "json");
    if (d && (d.from === userId || d.to === userId)) out.push(d);
  }

  out.sort((a, b) => b.created_ts - a.created_ts);
  return out.slice(0, limit);
}
