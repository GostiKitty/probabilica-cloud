import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import {
  getOrCreatePlayer,
  savePlayer,
  getDuel,
  withLock,
} from "../_lib/store.js";

const TEXT = {
  ru: [
    "Разнёс без шансов.",
    "Унизил красиво.",
    "Еле выжил, но победил.",
    "Случайно, но приятно.",
  ],
  en: [
    "Absolutely destroyed.",
    "Clean win.",
    "Barely survived.",
    "Lucky win.",
  ],
  cn: [
    "碾压。",
    "赢得很干净。",
    "勉强活着。",
    "运气不错。",
  ],
};

export async function onRequest({ request, env }) {
  try {
    const initData = getInitDataFromRequest(request);
    const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

    if (request.method !== "POST") return json(405, { error: "Method" });

    const { duel_id, lang = "ru" } = await request.json();
    if (!duel_id) return json(400, { error: "No duel_id" });

    return await withLock(env, `duel:${duel_id}`, 2000, async () => {
      const duel = await getDuel(env, duel_id);
      if (!duel) return json(404, { error: "Not found" });
      if (duel.resolved) return json(200, { duel });

      if (duel.to !== userId) return json(403, { error: "Forbidden" });

      const from = await getOrCreatePlayer(env, duel.from);
      const to = await getOrCreatePlayer(env, duel.to, username);

      if (from.coins < duel.stake || to.coins < duel.stake)
        return json(400, { error: "Coins" });

      const winner = Math.random() > 0.5 ? from.user_id : to.user_id;

      if (winner === from.user_id) {
        from.coins -= duel.stake;
        to.coins += duel.stake;
      } else {
        to.coins -= duel.stake;
        from.coins += duel.stake;
      }

      duel.resolved = true;
      duel.winner = winner;
      duel.text = {
        ru: TEXT.ru[Math.floor(Math.random() * TEXT.ru.length)],
        en: TEXT.en[Math.floor(Math.random() * TEXT.en.length)],
        cn: TEXT.cn[Math.floor(Math.random() * TEXT.cn.length)],
      };

      await env.PROB_KV.put(`duel:${duel.duel_id}`, JSON.stringify(duel));
      await savePlayer(env, from);
      await savePlayer(env, to);

      return json(200, { duel, profile: to });
    });
  } catch (e) {
    return json(401, { detail: e.message });
  }
}
