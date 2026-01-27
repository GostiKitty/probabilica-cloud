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

function apiBase() {
  // чтобы работало и в Telegram, и в браузере одинаково
  return window.location.origin;
}

async function api(path, body) {
  const res = await fetch(apiBase() + path, {
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

// UI helpers
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
  ui.modalTitle.textContent = title;
  ui.modalBody.textContent = body;
  ui.modal.hidden = false;
}

function closeModal() {
  ui.modal.hidden = true;
}

ui.modalBackdrop.addEventListener("click", closeModal);
ui.modalClose.addEventListener("click", closeModal);

function renderProfile(p) {
  ui.coins.textContent = String(p.coins ?? 0);
  ui.level.textContent = String(p.level ?? 1);
  ui.xp.textContent = String(p.xp ?? 0);

  ui.name.textContent = p.username || p.first_name || "—";
  ui.id.textContent = String(p.user_id || "—");
  ui.avatar.textContent = p.avatar_id || "—";
}

async function loadMe() {
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
    ui.lastResult.textContent = r.text || r.result_text || "Готово";
    if (r.profile) renderProfile(r.profile);
    setHint("");
  } catch (e) {
    setHint(e.message || "Ошибка");
  } finally {
    ui.btnSpin.disabled = false;
  }
}

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

// Boot
(async function boot() {
  initTelegramUi();

  console.log("[Probabilica] href:", window.location.href);
  console.log("[Probabilica] hasTelegram:", !!tg);
  console.log("[Probabilica] initDataLen:", initData().length);

  if (!initData()) {
    ui.subtitle.textContent = "Открывайте через Telegram";
    setHint("Требуется запуск из кнопки в боте.");
    return;

    ui.coins.classList.add("skeleton");
    ui.level.classList.add("skeleton");
    ui.xp.classList.add("skeleton");
    ui.name.classList.add("skeleton");
    ui.id.classList.add("skeleton");
    ui.avatar.classList.add("skeleton");
    ui.lastResult.classList.add("skeleton");
}

  try {
    await loadMe();
  } catch (e) {
    setHint(e.message || "Ошибка загрузки");
  }
})();

