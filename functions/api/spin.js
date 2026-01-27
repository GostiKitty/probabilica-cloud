import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";
import { spinSlot } from "../_lib/wheel.js";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  const p = await getOrCreatePlayer(env, userId, username);

  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  // анти-спам: обычные спины слегка ограничим, фриспины — нет
  const now = Date.now();
  const hasFree = (p.free_spins ?? 0) > 0;

  if (!hasFree) {
    const dt = now - (p.last_spin_ts || 0);
    if (dt < 900) {
      return json(429, { error: "Too fast" });
    }
  }

  const bonusMode = (p.bonus_until || 0) > now;
  const seed = Math.floor(Math.random() * 1e9);

  const r = spinSlot({ seed, bonusMode });

  // consume free spin if exists
  if (hasFree) p.free_spins = Math.max(0, (p.free_spins || 0) - 1);

  // meter rules
  // lose: +1, near: +2, win: +2, big: +3, scatter: +3
  const addMeter =
    r.kind === "big" ? 3 :
    r.kind === "win" ? 2 :
    r.kind === "near" ? 2 :
    r.kind === "scatter" ? 3 : 1;

  p.meter = clamp((p.meter || 0) + addMeter, 0, 10);

  // meter filled => +3 free spins and reset meter
  let meterTriggered = false;
  if (p.meter >= 10) {
    p.free_spins = (p.free_spins || 0) + 3;
    p.meter = 0;
    meterTriggered = true;
  }

  // scatter: +5 free spins + bonus mode 60s
  let scatterTriggered = false;
  if (r.kind === "scatter") {
    p.free_spins = (p.free_spins || 0) + 5;
    p.bonus_until = now + 60_000;
    scatterTriggered = true;
  }

  // apply rewards
  p.coins = (p.coins || 0) + r.winCoins;
  p.xp = (p.xp || 0) + r.winXp;

  // simple leveling
  const need = (lvl) => 50 + (lvl - 1) * 25;
  while (p.xp >= need(p.level || 1)) {
    p.xp -= need(p.level || 1);
    p.level = (p.level || 1) + 1;
  }

  p.last_spin_ts = now;
  await savePlayer(env, p);

  // response text (коротко)
  const text =
    r.kind === "scatter" ? "SCATTER — free spins" :
    r.kind === "big" ? "BIG WIN" :
    r.kind === "win" ? "WIN" :
    r.kind === "near" ? "NEAR" : "—";

  return json(200, {
    ok: true,
    spin: {
      seed,
      symbols: r.symbols,
      kind: r.kind,
      winCoins: r.winCoins,
      winXp: r.winXp,
      text,
      meter_add: addMeter,
      meter_triggered: meterTriggered,
      scatter_triggered: scatterTriggered,
      bonus_until: p.bonus_until || 0
    },
    profile: p
  });
}
