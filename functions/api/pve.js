import { json, getInitDataFromRequest, verifyInitData } from "../_lib/auth.js";
import { getOrCreatePlayer, savePlayer } from "../_lib/store.js";

/* RNG */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* character stats stored in avatar_id: "char|str=.|def=.|int=.|luck=." */
function parseStats(avatarId) {
  const base = { str: 1, def: 1, int: 1, luck: 1 };
  const s = String(avatarId || "");
  if (!s.startsWith("char|")) return base;

  const parts = s.split("|").slice(1);
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k) continue;
    if (k in base) base[k] = Math.max(1, Math.min(50, Number(v) || base[k]));
  }
  return base;
}

const ENEMIES = [
  { id: "electro_ded", ru: "ЭлектроДед", cn: "电爷", en: "Electro Grandpa", tier: 1 },
  { id: "axisless_graph", ru: "График Без Оси", cn: "没坐标的图", en: "Axisless Graph", tier: 1 },
  { id: "seedless_rng", ru: "Рандом без seed", cn: "无种随机", en: "Seedless RNG", tier: 2 },
  { id: "latex_error", ru: "Синтаксис в LaTeX", cn: "LaTeX 报错", en: "LaTeX Error", tier: 2 },
  { id: "deadline", ru: "Дедлайн", cn: "截止日期", en: "Deadline", tier: 3 },
];

function enemyStats(enemy, playerLevel) {
  // Мягкая шкала сложности: tier влияет сильнее, level — чуть-чуть
  const lvl = Math.max(1, Number(playerLevel) || 1);
  const t = enemy.tier || 1;

  const str = 2 + t * 2 + Math.floor(lvl * 0.35);
  const def = 2 + t * 2 + Math.floor(lvl * 0.35);
  const int = 2 + t * 1 + Math.floor(lvl * 0.25);
  const luck = 1 + t * 1 + Math.floor(lvl * 0.15);
  return { str, def, int, luck };
}

function simulateFight(statsA, statsB, seed) {
  const rng = mulberry32(seed);

  let aHP = 100 + statsA.def * 6;
  let bHP = 100 + statsB.def * 6;

  const log = [];

  for (let r = 1; r <= 3; r++) {
    const aCrit = rng() < (0.05 + statsA.int * 0.002);
    const aDmg = Math.max(1, statsA.str * (aCrit ? 1.6 : 1.0) + rng() * statsA.luck);
    bHP -= aDmg;
    log.push({ who: "you", dmg: Math.round(aDmg), crit: aCrit });

    if (bHP <= 0) return { winner: "YOU", log };

    const bCrit = rng() < (0.05 + statsB.int * 0.002);
    const bDmg = Math.max(1, statsB.str * (bCrit ? 1.6 : 1.0) + rng() * statsB.luck);
    aHP -= bDmg;
    log.push({ who: "enemy", dmg: Math.round(bDmg), crit: bCrit });

    if (aHP <= 0) return { winner: "ENEMY", log };
  }

  return { winner: aHP >= bHP ? "YOU" : "ENEMY", log };
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export async function onRequest({ request, env }) {
  const initData = getInitDataFromRequest(request);
  const { userId, username } = await verifyInitData(initData, env.BOT_TOKEN);

  const p = await getOrCreatePlayer(env, userId, username);

  if (request.method !== "POST") return json(405, { error: "Method not allowed" });

  const body = await request.json().catch(() => ({}));
  const enemy_id = String(body.enemy_id || "");
  const stake = Number(body.stake || 10);
  const lang = String(body.lang || "ru");

  if (!["ru", "en", "cn"].includes(lang)) return json(400, { error: "Bad lang" });
  if (![10, 25, 50].includes(stake)) return json(400, { error: "Bad stake" });

  const enemy = ENEMIES.find(e => e.id === enemy_id) || ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

  // проверим деньги
  if ((p.coins ?? 0) < stake) return json(400, { error: "Not enough coins" });

  const seed = Math.floor(Math.random() * 1e9);
  const you = parseStats(p.avatar_id);
  const bot = enemyStats(enemy, p.level);

  const { winner, log } = simulateFight(you, bot, seed);

  // экономика + XP + очки
  const win = winner === "YOU";

  // XP: за бой чуть-чуть, за победу больше, за сложных врагов тоже
  const tier = enemy.tier || 1;
  const baseXp = 2 + tier;
  const winXp = win ? (3 + tier) : 1;
  const gainXp = baseXp + winXp;

  // coins: победа = +stake, поражение = -stake (как в дуэлях)
  const deltaCoins = win ? stake : -stake;

  // glory: маленький рейтинг (не деньги)
  const deltaGlory = win ? (2 + tier) : -1;

  p.coins = (p.coins || 0) + deltaCoins;
  p.xp = (p.xp || 0) + gainXp;
  p.glory = clamp((p.glory || 0) + deltaGlory, 0, 999999);

  // leveling как в spin.js
  const need = (lvl) => 50 + (lvl - 1) * 25;
  while (p.xp >= need(p.level || 1)) {
    p.xp -= need(p.level || 1);
    p.level = (p.level || 1) + 1;
  }

  await savePlayer(env, p);

  const name =
    lang === "cn" ? enemy.cn :
    lang === "en" ? enemy.en :
    enemy.ru;

  return json(200, {
    ok: true,
    enemy: { id: enemy.id, name, tier },
    result: {
      win,
      seed,
      stake,
      deltaCoins,
      gainXp,
      deltaGlory,
      log
    },
    profile: p
  });
}
