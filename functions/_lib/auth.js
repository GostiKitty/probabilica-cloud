export function getInitDataFromRequest(request) {
  const h = request.headers;
  return (
    // то, что шлёт твой frontend/app.js
    h.get("X-Telegram-InitData") ||
    h.get("x-telegram-initdata") ||

    // на всякий случай: если где-то будет другой клиент/код
    h.get("X-TG-Init-Data") ||
    h.get("x-tg-init-data") ||

    ""
  );
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return toHex(sig);
}

async function sha256Bytes(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return new Uint8Array(buf);
}

function parseInitData(initData) {
  // initData = "query_id=...&user=...&hash=..."
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("No hash in initData");

  params.delete("hash");
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  return { hash, dataCheckString, params };
}

export async function verifyInitData(initData, botToken) {
  if (!initData) throw new Error("No initData");

  const { hash, dataCheckString, params } = parseInitData(initData);

  const secretKey = await sha256Bytes(botToken);
  const calcHash = await hmacSha256Hex(secretKey, dataCheckString);

  if (calcHash !== hash) throw new Error("Bad initData hash");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("No user in initData");
  const user = JSON.parse(userRaw);

  const userId = Number(user.id);
  const username = user.username || user.first_name || "player";
  return { userId, username };
}

export function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
