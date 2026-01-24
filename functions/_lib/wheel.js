export const WHEEL = [
  { id: "c10",  label: "+10 coins", type: "coins", value: 10, weight: 30 },
  { id: "c25",  label: "+25 coins", type: "coins", value: 25, weight: 22 },
  { id: "c50",  label: "+50 coins", type: "coins", value: 50, weight: 12 },
  { id: "x20",  label: "+20 XP",    type: "xp",    value: 20, weight: 18 },
  { id: "x40",  label: "+40 XP",    type: "xp",    value: 40, weight: 10 },
  { id: "jack", label: "JOKER",     type: "joker", value: 0,  weight: 8  },
];

export const SPIN_COST = 30;
export const COOLDOWN_SEC = 8;

export function weightedChoice(items) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function applyReward(player, reward) {
  if (reward.type === "coins") {
    player.coins += reward.value;
    return `+${reward.value} coins`;
  }
  if (reward.type === "xp") {
    player.xp += reward.value;
    while (player.xp >= 100) {
      player.xp -= 100;
      player.level += 1;
      player.coins += 20;
    }
    return `+${reward.value} XP`;
  }
  if (reward.type === "joker") {
    const roll = Math.random();
    if (roll < 0.45) { player.coins += 100; return "JOKER: +100 coins"; }
    if (roll < 0.85) { player.coins = Math.max(0, player.coins - 15); return "JOKER: -15 coins"; }
    player.level += 1; return "JOKER: +1 level";
  }
  return "No reward";
}
