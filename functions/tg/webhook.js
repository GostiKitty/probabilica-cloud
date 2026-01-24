import { json } from "../_lib/auth.js";

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log("tgCall", method, "status", res.status, "resp", data);
  return data;
}

export async function onRequest({ request, env }) {
  console.log("WEBHOOK HIT", request.method);

  // чтобы GET в браузере показывал, что функция живая
  if (request.method !== "POST") {
    return json(200, { ok: true, note: "Send POST updates here" });
  }

  let update = null;
  try {
    update = await request.json();
  } catch (e) {
    console.log("Bad JSON", e);
    return json(200, { ok: true });
  }

  console.log("UPDATE", update);

  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();

  if (!env.BOT_TOKEN) {
    console.log("Missing BOT_TOKEN env");
    return json(200, { ok: true });
  }

  // отвечаем на ЛЮБОЕ сообщение, чтобы проверить, что бот жив
  if (chatId) {
    const webappUrl = env.WEBAPP_URL || "https://probabilica-cloud.pages.dev";

    await tgCall(env, "sendMessage", {
      chat_id: chatId,
      text: text === "/start"
        ? "🎲 Probabilica готова! Жми кнопку ниже:"
        : `Я получил: ${text}\nНажми кнопку, чтобы открыть игру:`,
      reply_markup: {
        keyboard: [[{ text: "🎮 Играть в Probabilica", web_app: { url: webappUrl } }]],
        resize_keyboard: true,
      },
    });
  }

  return json(200, { ok: true });
}
