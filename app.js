const tg = window.Telegram?.WebApp;

function initTelegramUi() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.("#0A0A0A");
    tg.setBackgroundColor?.("#0A0A0A");
  } catch {}
}

function initData() {
  return tg?.initData || "";
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-InitData": initData(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.detail || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const el = (id) => document.getElementById(id);
const ui = {
  subtitle: el("subtitle"),
  coins: el("coins"),
  level: el("level"),
  xp: el("xp"),
  name: el("name"),
  id: el("id"),
  avatar: el("avatar"),
  lastResult: el("lastResult"),
  hint: el("hint"),
  btnSpin: el("btnSpin"),
  btnAvatar: el("btnAvatar"),
  btnRefresh: el("btnRefresh"),
  btnRules: el("btnRules"),
  btnSupport: el("btnSupport"),
  modal: el("modal"),
  modalBackdrop: el("modalBackdrop"),
  modalTitle: el("modalTitle"),
  modalBody: el("modalBody"),
  modalClose: el("modalClose"),
};

function setHint(msg) {
  ui.hint.textContent = msg || "";
}

function openModal(title, body) {
  ui.modalTitle.textContent = title || "";
  ui.modalBody.textContent = body || "";
  ui.modal.hidden = false;
}
function closeModal() { ui.modal.hidden = true; }

ui.modalBackdrop.addEventListener("click", closeModal);
ui.modalClose.addEventListener("click", closeModal);

function setLoading(on) {
  const nodes = [ui.coins, ui.level, ui.xp, ui.name, ui.id, ui.avatar, ui.lastResult];
  for (const n of nodes) {
    if (!n) continue;
    n.classList.toggle("skeleton", on);
    if (on) n.textContent = "";
  }
}

function renderProfile(p) {
  setLoading(false);

  ui.coins.textContent = String(p.coins ?? 0);
  ui.level.textContent = String(p.level ?? 1);
  ui.xp.textContent = String(p.xp ?? 0);

  ui.name.textContent = p.username || p.first_name || "player";
  ui.id.textContent = String(p.user_id || "");
  ui.avatar.textContent = p.avatar_id || "a1";
}

async function loadMe() {
  setLoading(true);
  setHint("Загрузка…");
  const me = await api("/api/me");
  renderProfile(me);
  setHint("");
}

async function spin() {
  ui.btnSpin.disabled = true;
  setHint("Крутка…");
  try {
    const r = await api("/api/spin", {});
    ui.lastResult.classList.remove("skeleton");
    ui.lastResult.textContent = r.text || r.result_text || "Готово";
    if (r.profile) renderProfile(r.profile);
    setHint("");
  } catch (e) {
    setHint(e.message || "Ошибка");
  } finally {
    ui.btnSpin.disabled = false;
  }
}

// пока простая смена — дальше заменим на галерею
async function chooseAvatar() {
  const next = prompt("Введите ID аватара (например a1)");
  if (!next) return;

  ui.btnAvatar.disabled = true;
  setHint("Сохранение…");
  try {
    const r = await api("/api/avatar", { avatar_id: next });
    if (r.profile) renderProfile(r.profile);
    setHint("");
  } catch (e) {
    setHint(e.message || "Ошибка");
  } finally {
    ui.btnAvatar.disabled = false;
  }
}

ui.btnSpin.addEventListener("click", spin);
ui.btnAvatar.addEventListener("click", chooseAvatar);
ui.btnRefresh.addEventListener("click", () => loadMe().catch(err => setHint(err.message)));

ui.btnRules.addEventListener("click", () =>
  openModal("Правила", "Игра использует внутриигровые очки. Реальные деньги не участвуют.")
);
ui.btnSupport.addEventListener("click", () =>
  openModal("Поддержка", "Если что-то не работает, откройте игру заново и нажмите «Обновить».")
);

(async function boot() {
  initTelegramUi();

  if (!initData()) {
    ui.subtitle.textContent = "Открывайте через Telegram";
    setHint("Запустите мини-приложение из бота.");
    setLoading(false);
    return;
  }

  try {
    await loadMe();
  } catch (e) {
    setLoading(false);
    setHint(e.message || "Ошибка загрузки");
  }
})();
