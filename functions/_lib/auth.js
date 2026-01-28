export function getInitDataFromRequest(request) {
  const h = request.headers;
  return (
    h.get("X-Telegram-InitData") ||
    h.get("x-telegram-initdata") ||
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

async function hmacSha256Bytes(keyBytes, message) {
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
  return new Uint8Array(sig);
}

async function hmacSha256Hex(keyBytes, message) {
  const bytes = await hmacSha256Bytes(keyBytes, message);
  return toHex(bytes);
}

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("No hash in initData");

  params.delete("hash");
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  return { hash, dataCheckString, params };
}

export async function verifyInitData(initData, botToken) {
  if (!botToken) throw new Error("No BOT_TOKEN");
  if (!initData) throw new Error("No initData");

  const { hash, dataCheckString, params } = parseInitData(initData);

  // Telegram Mini Apps:
  // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
  const secretKey = await hmacSha256Bytes(
    new TextEncoder().encode("WebAppData"),
    botToken
  );

  // calc_hash = HMAC_SHA256(data_check_string, key=secret_key)
  const calcHash = await hmacSha256Hex(secretKey, dataCheckString);

  if (calcHash !== hash) throw new Error("Bad initData hash");

  // optional security: freshness
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate) throw new Error("No auth_date");

  const ageSec = Math.floor(Date.now() / 1000) - authDate;
  if (ageSec > 24 * 3600) throw new Error("initData expired");

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
