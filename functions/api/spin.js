import {
  json,
  getInitDataFromRequest,
  verifyInitData,
} from "../_lib/auth.js";

import {
  getOrCreatePlayer,
  savePlayer,
  withLock,
} from "../_lib/store.js";

const SYMBOLS = ["BAR", "BELL", "SEVEN", "CHERRY", "STAR", "COIN", "SCATTER"];

function rnd(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    // ⚠️ KV TTL минимум 60 сек — Cloudflare правило
    return await withLock(env, `spin:${userId}`, 60_000, async () => {
      const p = await getOrCreatePlayer(env, userId, username);

      // ✅ мягкий антиспам: реальный кулдаун 1100мс (без KV TTL)
      const now = Date.now();
      const last = p.last_spin_ts || 0;
      if (now - last < 1100) {
        return json(429, { detail: "Тише, ковбой. Не DDOSь удачу." });
      }
      p.last_spin_ts = now;

      // ---------- RTP-подкрутка ----------
      const spins = p.stats?.spins || 0;
      const wins = p.stats?.wins || 0;
      const balance = p.coins || 0;

      let luck = 0.92;

      if (spins > 15 && wins / Math.max(1, spins) < 0.25) luck += 0.06;
      if (wins / Math.max(1, spins) > 0.45) luck -= 0.07;
      if (balance < 50) luck += 0.05;

      const roll = Math.random();

      let kind = "lose";
      if (roll < luck * 0.05) kind = "big";
      else if (roll < luck * 0.18) kind = "win";
      else if (roll < luck * 0.30) kind = "near";

      // ---------- Символы ----------
      let symbols;

      if (kind === "big") {
        const s = rnd(["SEVEN", "STAR"]);
        symbols = [s, s, s];
      } else if (kind === "win") {
        const s = rnd(["CHERRY", "COIN", "BELL"]);
        symbols = [s, s, rnd(SYMBOLS)];
      } else if (kind === "near") {
        const s = rnd(["SEVEN", "STAR"]);
        symbols = [s, s, rnd(SYMBOLS.filter(x => x !== s))];
      } else {
        symbols = [rnd(SYMBOLS), rnd(SYMBOLS), rnd(SYMBOLS)];
      }

      // ---------- Бонус ----------
      let bonus = false;
      if (symbols.filter(s => s === "SCATTER").length >= 2) {
        kind = "scatter";
        bonus = true;
      }

      // ---------- Награды ----------
      let winCoins = 0;
      let winXp = 1;

      if (kind === "win") winCoins = 10 + Math.floor(Math.random() * 15);
      if (kind === "big") winCoins = 50 + Math.floor(Math.random() * 50);
      if (kind === "scatter") winCoins = 20;

      p.coins = (p.coins || 0) + winCoins;
      p.xp = (p.xp || 0) + winXp;

      p.stats = p.stats || {};
      p.stats.spins = spins + 1;
      if (kind === "win" || kind === "big") p.stats.wins = wins + 1;

      await savePlayer(env, p);

      return json(200, {
        spin: { symbols, kind, winCoins, winXp, bonus },
        profile: p,
      });
    });

  } catch (e) {
    // ❗ больше не “Auth failed” на любую хрень — даём честную ошибку
    return json(401, { detail: e?.message || String(e) });
  }
}
