import { json } from "../_lib/auth.js";

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json().catch(() => ({}));
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json(200, { ok: true });

  let update;
  try { update = await request.json(); } catch { return json(200, { ok: true }); }

  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text || "";

  if (!chatId || !env.BOT_TOKEN) return json(200, { ok: true });
  if (!text.startsWith("/start")) return json(200, { ok: true });

  const webappUrl =
    (env.WEBAPP_URL && env.WEBAPP_URL.trim()) ||
    "https://probabilica-cloud.pages.dev/?v=15";

  await tgCall(env, "sendMessage", {
    chat_id: chatId,
    text: "Probabilica",
    reply_markup: {
      inline_keyboard: [[
        {
          text: "Ааааааааааааааааааааа",
          web_app: { url: webappUrl }
        }
      ]]
    }
  });

  return json(200, { ok: true });
}
