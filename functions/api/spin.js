import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";
import { spinSlot } from "../_lib/wheel.js";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function randU32() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] >>> 0;
}

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    const p = await getOrCreatePlayer(env, userId, username);

    if (request.method !== "POST") return json(405, { error: "Method not allowed" });

    // анти-спам: обычные спины слегка ограничим, фриспины — нет
    const now = Date.now();
    const hasFree = (p.free_spins ?? 0) > 0;
    if (!hasFree) {
      const dt = now - (p.last_spin_ts || 0);
      if (dt < 900) return json(429, { error: "Too fast" });
    }

    const bonusMode = (p.bonus_until || 0) > now;
    const seed = randU32();

    // достаем luck из avatar_id
    function parseLuck(avatarId) {
      const s = String(avatarId || "");
      if (!s.startsWith("char|")) return 1;
      const parts = s.split("|");
      for (const it of parts) {
        const [k, v] = it.split("=");
        if (k === "luck") return clamp(Number(v) || 1, 1, 10);
      }
      return 1;
    }

    const luck = parseLuck(p.avatar_id);

    const spin = spinSlot({ seed, luck, bonusMode });

    // экономика
    if (hasFree) {
      p.free_spins = Math.max(0, (p.free_spins || 0) - 1);
    } else {
      // платный спин
      p.coins = Math.max(0, (p.coins || 0) - 5);
      p.last_spin_ts = now;
    }

    // награды
    p.coins = (p.coins || 0) + (spin.winCoins || 0);
    p.xp = (p.xp || 0) + (spin.winXp || 0);

    // meter
    p.meter = clamp((p.meter || 0) + (spin.kind === "lose" ? 1 : 2), 0, 10);

    let meter_triggered = false;
    if (p.meter >= 10) {
      p.meter = 0;
      p.free_spins = (p.free_spins || 0) + 3;
      meter_triggered = true;
    }

    // scatter -> free spins
    if (spin.kind === "scatter") {
      p.free_spins = (p.free_spins || 0) + 2;
    }

    // bonus cosmetics
    let bonus_until = p.bonus_until || 0;
    if (spin.kind === "big") {
      bonus_until = now + 2 * 60 * 1000;
      p.bonus_until = bonus_until;
    }

    await savePlayer(env, p);

    return json(200, {
      spin: {
        ...spin,
        meter_triggered,
        bonus_until: p.bonus_until || 0,
      },
      profile: {
        user_id: p.user_id,
        username: p.username,
        avatar_id: p.avatar_id,
        coins: p.coins,
        level: p.level,
        xp: p.xp,
        free_spins: p.free_spins ?? 0,
        meter: p.meter ?? 0,
        bonus_until: p.bonus_until ?? 0,
      }
    });
  } catch (e) {
    return json(401, { detail: `Auth failed: ${e.message || e}` });
  }
}
