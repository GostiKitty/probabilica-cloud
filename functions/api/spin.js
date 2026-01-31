import { json, auth } from "../_lib/auth.js";
import { getPlayer, savePlayer, withLock } from "../_lib/store.js";

/*
RTP-логика:
- базовый RTP ~92%
- если игрок давно в минусе → чуть чаще win/near
- если часто выигрывает → сушим
- всё незаметно
*/

function rnd(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SYMBOLS = ["BAR", "BELL", "SEVEN", "CHERRY", "STAR", "COIN", "SCATTER"];

export async function onRequest(ctx) {
  const a = await auth(ctx);
  if (!a.ok) return a.res;

  const { env } = ctx;
  const uid = a.user_id;

  return withLock(env, `spin:${uid}`, async () => {
    const p = await getPlayer(env, uid);

    // ---- RTP ПОДКРУТКА ----
    const spins = p.stats?.spins || 0;
    const wins = p.stats?.wins || 0;
    const balance = p.coins;

    let luck = 0.92; // базовый RTP

    if (spins > 20 && wins / spins < 0.25) luck += 0.06; // давно не везло
    if (wins / Math.max(1, spins) > 0.45) luck -= 0.07; // слишком везёт
    if (balance < 50) luck += 0.05; // почти нищий

    const roll = Math.random();

    let kind = "lose";
    if (roll < luck * 0.05) kind = "big";
    else if (roll < luck * 0.18) kind = "win";
    else if (roll < luck * 0.3) kind = "near";

    // ---- СИМВОЛЫ ----
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

    // ---- БОНУС (SCATTER) ----
    let bonus = false;
    if (symbols.filter(s => s === "SCATTER").length >= 2) {
      bonus = true;
      kind = "scatter";
    }

    // ---- НАГРАДЫ ----
    let winCoins = 0;
    let winXp = 1;

    if (kind === "win") winCoins = 10 + Math.floor(Math.random() * 15);
    if (kind === "big") winCoins = 50 + Math.floor(Math.random() * 50);
    if (kind === "scatter") winCoins = 20;

    p.coins += winCoins;
    p.xp += winXp;

    p.stats = p.stats || {};
    p.stats.spins = spins + 1;
    if (kind === "win" || kind === "big") p.stats.wins = wins + 1;

    await savePlayer(env, p);

    return json(200, {
      spin: {
        symbols,
        kind,
        winCoins,
        winXp,
        bonus, // ← важно
      },
      profile: p,
    });
  });
}
