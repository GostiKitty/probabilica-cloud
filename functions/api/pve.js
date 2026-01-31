import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer, withLock } from "../_lib/store.js";

const ENEMIES = [
  { id: "gost", tier: 1, ru: "ГОСТ", en: "GOST", cn: "标准" },
  { id: "rng", tier: 2, ru: "Рандом без seed", en: "Seedless RNG", cn: "无种随机" },
  { id: "deadline", tier: 3, ru: "Дедлайн", en: "Deadline", cn: "截止日期" },
  { id: "review", tier: 4, ru: "Ревьюер", en: "Reviewer", cn: "审查员" },
];

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if (request.method !== "POST") return json(405, { error: "Method" });

    return await withLock(env, `pve:${userId}`, 1500, async () => {
      const { enemy_id, stake, lang = "ru" } = await request.json();
      if (![10, 25, 50].includes(stake)) return json(400, { error: "Stake" });

      const p = await getOrCreatePlayer(env, userId, username);
      if (p.coins < stake) return json(400, { error: "Coins" });

      const enemy =
        ENEMIES.find(e => e.id === enemy_id) ||
        ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

      const winChance = 0.55 - enemy.tier * 0.05;
      const win = Math.random() < winChance;

      const deltaCoins = win ? stake : -stake;
      const gainXp = 3 + enemy.tier;
      const deltaGlory = win ? enemy.tier * 2 : -1;

      p.coins += deltaCoins;
      p.xp += gainXp;
      p.glory = Math.max(0, p.glory + deltaGlory);
      p.pve_streak = win ? p.pve_streak + 1 : 0;

      let daily = null;
      const now = Date.now();
      if (win && now - p.daily_pve_ts > 86400000) {
        daily = { coins: 20, glory: 3 };
        p.coins += daily.coins;
        p.glory += daily.glory;
        p.daily_pve_ts = now;
      }

      await savePlayer(env, p);

      return json(200, {
        enemy: { id: enemy.id, name: enemy[lang], tier: enemy.tier },
        result: { win, deltaCoins, gainXp, deltaGlory },
        streak: p.pve_streak,
        daily,
        profile: p,
      });
    });
  } catch (e) {
    return json(401, { detail: e.message });
  }
}
