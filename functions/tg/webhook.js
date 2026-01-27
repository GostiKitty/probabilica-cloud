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

  // GET — чтобы в браузере видеть, что функция живая
  if (request.method !== "POST") {
    return json(200, { ok: true, note: "POST updates here" });
  }

  let update = null;
  try {
    update = await request.json();
  } catch (e) {
    console.log("Bad JSON", e);
    return json(200, { ok: true });
  }

  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();

  if (!env.BOT_TOKEN) {
    console.log("Missing BOT_TOKEN env");
    return json(200, { ok: true });
  }

  if (chatId) {
    // ВАЖНО: /frontend/ обязательно со слэшем + добавляем v= чтобы Telegram не кешировал старую страницу
    const webappUrl =
      (env.WEBAPP_URL && env.WEBAPP_URL.trim()) ||
      "https://probabilica-cloud.pages.dev/frontend/?v=10";

    await tgCall(env, "sendMessage", {
      chat_id: chatId,
      text: "Probabilica",
      reply_markup: {
        keyboard: [[{ text: "Играть", web_app: { url: webappUrl } }]],
        resize_keyboard: true,
      },
    });
  }

  return json(200, { ok: true });
}
