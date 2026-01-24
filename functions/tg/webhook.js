import { json } from "../_lib/auth.js";

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.8212314131:AAE6EZhfbJmccD-2-GeTgFyi7FWwJn6Ny5k}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function onRequest({ request, env }) {
  const update = await request.json().catch(() => null);
  if (!update) return json(200, { ok: true });

  const msg = update.message;
  if (!msg) return json(200, { ok: true });

  const text = (msg.text || "").trim();
  const chatId = msg.chat?.id;

  if (text === "/start" && chatId) {
    const webappUrl = env.WEBAPP_URL; // укажем URL Pages
    await tgCall(env, "sendMessage", {
      chat_id: chatId,
      text: "🎲 Probabilica готова! Нажми кнопку ниже, чтобы открыть игру:",
      reply_markup: {
        keyboard: [[{ text: "🎮 Играть в Probabilica", web_app: { url: webappUrl } }]],
        resize_keyboard: true
      }
    });
  }

  return json(200, { ok: true });
}
