function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SYMBOLS = [
  { id: "BAR", w: 12 },
  { id: "BELL", w: 10 },
  { id: "SEVEN", w: 4 },
  { id: "CHERRY", w: 14 },
  { id: "STAR", w: 8 },
  { id: "COIN", w: 12 },
  { id: "SCATTER", w: 3 }, // дает фриспины
];

function pickWeighted(rng) {
  const sum = SYMBOLS.reduce((a, s) => a + s.w, 0);
  let r = rng() * sum;
  for (const s of SYMBOLS) {
    r -= s.w;
    if (r <= 0) return s.id;
  }
  return "BAR";
}

function payoutFor3(symbol) {
  // аккуратно: не делаем “миллионы”, чтобы экономика не ломалась
  switch (symbol) {
    case "CHERRY": return 8;
    case "COIN": return 10;
    case "BAR": return 12;
    case "BELL": return 16;
    case "STAR": return 24;
    case "SEVEN": return 60;
    default: return 0;
  }
}

function isNearMiss(a, b, c) {
  // 2 одинаковых, третья другая, но не scatter-комбо
  if (a === "SCATTER" || b === "SCATTER" || c === "SCATTER") return false;
  return (a === b && b !== c) || (a === c && a !== b) || (b === c && a !== b);
}

export function spinSlot({ seed, bonusMode = false }) {
  const rng = mulberry32(seed);

  // bonusMode: чуть повышаем шанс редких
  const roll = () => {
    if (!bonusMode) return pickWeighted(rng);
    // в бонусе иногда “подталкиваем” к STAR/SEVEN
    const x = rng();
    if (x < 0.06) return "SEVEN";
    if (x < 0.14) return "STAR";
    return pickWeighted(rng);
  };

  const a = roll();
  const b = roll();
  const c = roll();

  const scatters = [a, b, c].filter(s => s === "SCATTER").length;

  let winCoins = 0;
  let winXp = 0;
  let kind = "lose"; // lose | near | win | big | scatter

  if (scatters === 3) {
    kind = "scatter";
    winCoins = 18;
    winXp = 8;
  } else if (a === b && b === c) {
    winCoins = payoutFor3(a);
    winXp = Math.max(3, Math.floor(winCoins / 4));
    kind = winCoins >= 50 ? "big" : "win";
  } else if (isNearMiss(a, b, c)) {
    kind = "near";
    winCoins = 2;
    winXp = 1;
  } else {
    winCoins = 0;
    winXp = 1; // чтобы “не больно” и был прогресс
  }

  return {
    symbols: [a, b, c],
    kind,
    winCoins,
    winXp
  };
}
