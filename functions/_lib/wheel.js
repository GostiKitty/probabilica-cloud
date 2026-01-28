function randU32() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] >>> 0;
}

// простой LCG для детерминированности результата по seed
function makeRng(seed) {
  let x = (seed >>> 0) || 123456789;
  return () => {
    x = (1664525 * x + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

const SYMBOLS = ["BAR","BELL","SEVEN","CHERRY","STAR","COIN","SCATTER"];

export function spinSlot({ seed, luck = 1, bonusMode = false }) {
  seed = Number.isFinite(seed) ? seed : randU32();
  luck = Math.max(1, Math.min(10, Number(luck) || 1));

  const rng = makeRng(seed);

  // базовые веса
  const base = {
    BAR: 10,
    BELL: 12,
    SEVEN: 4,
    CHERRY: 16,
    STAR: 10,
    COIN: 18,
    SCATTER: 6,
  };

  // luck слегка увеличивает шанс "хороших" символов
  base.SEVEN += Math.floor(luck / 2);
  base.STAR += Math.floor(luck / 3);
  base.SCATTER += Math.floor(luck / 3);

  // bonusMode чуть поднимает rare
  if (bonusMode) {
    base.SEVEN += 2;
    base.SCATTER += 2;
    base.STAR += 1;
  }

  const pool = [];
  for (const s of SYMBOLS) {
    for (let i = 0; i < base[s]; i++) pool.push(s);
  }

  function pick() {
    const i = Math.floor(rng() * pool.length);
    return pool[i];
  }

  const a = pick();
  const b = pick();
  const c = pick();

  const symbols = [a, b, c];

  // kind + payout
  let kind = "lose";
  let winCoins = 0;
  let winXp = 1;

  const allSame = a === b && b === c;
  const anyScatter = symbols.filter(s => s === "SCATTER").length;

  if (anyScatter >= 2) {
    kind = "scatter";
    winCoins = 10;
    winXp = 3;
  } else if (allSame) {
    kind = (a === "SEVEN" || a === "SCATTER") ? "big" : "win";
    winCoins = a === "SEVEN" ? 45 : 20;
    winXp = a === "SEVEN" ? 10 : 6;
  } else if (a === b || b === c || a === c) {
    kind = "near";
    winCoins = 4;
    winXp = 2;
  }

  // drop может быть
  let drop = null;
  if (kind === "big" && rng() < 0.20) {
    drop = { title: "Drop", effect: "Luck +1 (visual)" };
  }

  return { seed, symbols, kind, winCoins, winXp, drop };
}
