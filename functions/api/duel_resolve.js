import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getDuel, getOrCreatePlayer, savePlayer } from "../_lib/store.js";

/* RNG */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* character stats stored in avatar_id: "char|str=..|def=..|int=..|luck=.." */
function parseStats(avatarId) {
  const base = { str: 1, def: 1, int: 1, luck: 1 };
  const s = String(avatarId || "");
  if (!s.startsWith("char|")) return base;

  const parts = s.split("|").slice(1);
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k) continue;
    if (k in base) base[k] = Math.max(1, Math.min(50, Number(v) || base[k]));
  }
  return base;
}

function simulateFight(statsA, statsB, seed) {
  const rng = mulberry32(seed);

  let aHP = 100 + statsA.def * 6;
  let bHP = 100 + statsB.def * 6;

  for (let r = 0; r < 3; r++) {
    const aCrit = rng() < (0.05 + statsA.int * 0.002);
    const aDmg = Math.max(1, statsA.str * (aCrit ? 1.6 : 1.0) + rng() * statsA.luck);
    bHP -= aDmg;

    if (bHP <= 0) return "A";

    const bCrit = rng() < (0.05 + statsB.int * 0.002);
    const bDmg = Math.max(1, statsB.str * (bCrit ? 1.6 : 1.0) + rng() * statsB.luck);
    aHP -= bDmg;

    if (aHP <= 0) return "B";
  }
  return aHP >= bHP ? "A" : "B";
}

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  await getOrCreatePlayer(env, userId, username);

  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const body = await request.json().catch(() => ({}));
  const duelId = body.duel_id;
  const duel = await getDuel(env, duelId);

  if (!duel) return json(404, { error: "Duel not found" });
  if (duel.resolved) return json(200, { duel });

  // только участники могут резолвить
  if (userId !== duel.from && userId !== duel.to) return json(403, { error: "Forbidden" });

  const pA = await getOrCreatePlayer(env, duel.from, null);
  const pB = await getOrCreatePlayer(env, duel.to, null);

  // проверим деньги
  if ((pA.coins ?? 0) < duel.stake) return json(400, { error: "From has not enough coins" });
  if ((pB.coins ?? 0) < duel.stake) return json(400, { error: "To has not enough coins" });

  const sA = parseStats(pA.avatar_id);
  const sB = parseStats(pB.avatar_id);

  const winnerSide = simulateFight(sA, sB, duel.seed);
  const winnerId = winnerSide === "A" ? duel.from : duel.to;
  const loserId = winnerSide === "A" ? duel.to : duel.from;

  // экономика: победитель получает stake, проигравший теряет stake
  if (winnerId === duel.from) {
    pA.coins += duel.stake;
    pB.coins -= duel.stake;
  } else {
    pB.coins += duel.stake;
    pA.coins -= duel.stake;
  }

  duel.resolved = true;
  duel.winner = winnerId;

  await savePlayer(env, pA);
  await savePlayer(env, pB);
  await env.PROB_KV.put(`duel:${duel.duel_id}`, JSON.stringify(duel));

  return json(200, { duel, winner_id: winnerId, loser_id: loserId });
}
