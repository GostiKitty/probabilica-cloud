import { json, auth } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock } from "../_lib/store.js";

/*
  SLOT / SPIN
  - сервер-авторитетный
  - мягкая RTP-подкрутка
  - бонус по scatter
  - защита от накликивания через KV-lock
*/

const SYMBOLS = ["BAR", "BELL", "SEVEN", "CHERRY", "STAR", "COIN", "SCATTER"];

function rnd(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function onRequest(ctx) {
  const a = await auth(ctx);
  if (!a.ok) return a.res;

  const { env } = ctx;
  const uid = a.user_id;
  const username = a.username || `user${uid}`;

  // 🔒 анти-спам лок (1.2 сек)
  return withLock(env, `spin:${uid}`, 1200, async () => {
    const p = await getOrCreatePlayer(env, uid, username);

    /* ===== RTP-подкрутка ===== */
    const spins = p.stats?.spins || 0;
    const wins = p.stats?.wins || 0;
    const balance = p.coins || 0;

    let luck = 0.92; // базовый RTP

    if (spins > 15 && wins / Math.max(1, spins) < 0.25) luck += 0.06; // давно не везло
    if (wins / Math.max(1, spins) > 0.45) luck -= 0.07;              // слишком везёт
    if (balance < 50) luck += 0.05;                                  // почти нищий

    const roll = Math.random();

    let kind = "lose";
    if (roll < luck * 0.05) kind = "big";
    else if (roll < luck * 0.18) kind = "win";
    else if (roll < luck * 0.30) kind = "near";

    /* ===== Символы ===== */
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

    /* ===== Бонус (scatter) ===== */
    let bonus = false;
    if (symbols.filter(s => s === "SCATTER").length >= 2) {
      kind = "scatter";
      bonus = true;
    }

    /* ===== Награды ===== */
    let winCoins = 0;
    let winXp = 1;

    if (kind === "win") winCoins = 10 + Math.floor(Math.random() * 15);
    if (kind === "big") winCoins = 50 + Math.floor(Math.random() * 50);
    if (kind === "scatter") winCoins = 20;

    p.coins += winCoins;
    p.xp += winXp;

    /* ===== Статы для RTP ===== */
    p.stats = p.stats || {};
    p.stats.spins = spins + 1;
    if (kind === "win" || kind === "big") {
      p.stats.wins = wins + 1;
    }

    await savePlayer(env, p);

    return json(200, {
      spin: {
        symbols,
        kind,
        winCoins,
        winXp,
        bonus,
      },
      profile: p,
    });
  });
}
