const yearEl = document.getElementById("year");
const authCard = document.getElementById("auth-card");
const appPanel = document.getElementById("app-panel");
const authFeedback = document.getElementById("auth-feedback");
const userEmail = document.getElementById("user-email");

const loginForm = document.getElementById("login-form");
const transactionForm = document.getElementById("transaction-form");
const logoutBtn = document.getElementById("logout-btn");
const filterDateInput = document.getElementById("filter-date");
const dateInput = document.getElementById("date");
const historyList = document.getElementById("history-list");
const summaryText = document.getElementById("monthly-summary");
const kpiIncome = document.getElementById("kpi-income");
const kpiExpense = document.getElementById("kpi-expense");
const kpiProfit = document.getElementById("kpi-profit");
const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
const revealElements = document.querySelectorAll(".reveal");

const DEMO_USERS_KEY = "upgestor_demo_users_v1";
const DEMO_TRANSACTIONS_KEY = "upgestor_demo_transactions_v1";
const DEMO_SESSION_KEY = "upgestor_demo_session_v1";

const demoAuth = { currentUser: null };
let currentTransactions = [];

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

if (dateInput) {
  dateInput.valueAsDate = new Date();
}

function initRevealAnimations() {
  if (!revealElements.length) {
    return;
  }

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function trackWhatsAppClick(link) {
  if (typeof window.gtag !== "function") {
    return;
  }

  const label = (link.textContent || "whatsapp_cta").trim().toLowerCase().replace(/\s+/g, "_");
  window.gtag("event", "generate_lead", {
    currency: "BRL",
    value: 1,
    method: "whatsapp",
    event_category: "engagement",
    event_label: label,
    link_url: link.href
  });
}

function bindWhatsAppTracking() {
  whatsappLinks.forEach((link) => {
    link.addEventListener("click", () => trackWhatsAppClick(link));
  });
}

function getDemoUsers() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function setDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function getDemoTransactions() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_TRANSACTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function setDemoTransactions(transactions) {
  localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function saveDemoSession(user) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

function getDemoSession() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseDateString(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

function resetDashboard() {
  if (historyList) {
    historyList.innerHTML = "";
  }

  if (kpiIncome) {
    kpiIncome.textContent = "R$ 0,00";
  }

  if (kpiExpense) {
    kpiExpense.textContent = "R$ 0,00";
  }

  if (kpiProfit) {
    kpiProfit.textContent = "R$ 0,00";
  }

  if (summaryText) {
    summaryText.textContent = "Sem dados no m\u00eas atual.";
  }
}

function updateKpis(transactions) {
  if (!kpiIncome || !kpiExpense || !kpiProfit || !summaryText) {
    return;
  }

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthTransactions = transactions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  const income = monthTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expense = monthTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const profit = income - expense;

  kpiIncome.textContent = formatCurrency(income);
  kpiExpense.textContent = formatCurrency(expense);
  kpiProfit.textContent = formatCurrency(profit);
  summaryText.textContent = `Resumo mensal: Entradas ${formatCurrency(income)}, Sa\u00eddas ${formatCurrency(
    expense
  )}, Lucro ${formatCurrency(profit)}.`;
}

function renderHistory(transactions, dateFilter = "") {
  if (!historyList) {
    return;
  }

  historyList.innerHTML = "";
  const filtered = dateFilter ? transactions.filter((item) => item.date === dateFilter) : transactions;

  if (!filtered.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item";
    emptyItem.textContent = "Nenhuma movimenta\u00e7\u00e3o encontrada.";
    historyList.appendChild(emptyItem);
    return;
  }

  filtered.forEach((item) => {
    const line = document.createElement("li");
    line.className = "history-item";

    const title = document.createElement("strong");
    title.className = item.type;
    title.textContent = `${item.type === "income" ? "Entrada" : "Sa\u00edda"}: ${formatCurrency(item.amount)}`;

    const category = document.createElement("div");
    category.textContent = item.category;

    const date = document.createElement("small");
    date.textContent = parseDateString(item.date);

    line.appendChild(title);
    line.appendChild(category);
    line.appendChild(date);
    historyList.appendChild(line);
  });
}

function setLoggedView(user) {
  if (!authCard || !appPanel || !userEmail) {
    return;
  }

  if (user) {
    authCard.classList.add("hidden");
    appPanel.classList.remove("hidden");
    userEmail.textContent = user.email || "Usu\u00e1rio logado";
    return;
  }

  authCard.classList.remove("hidden");
  appPanel.classList.add("hidden");
  userEmail.textContent = "";
  resetDashboard();
}

function showLocalModeMessage(extra = "") {
  if (!authFeedback) {
    return;
  }

  authFeedback.textContent =
    "Modo local ativo. Login e dados salvos neste navegador para demonstra\u00e7\u00e3o." +
    (extra ? ` ${extra}` : "");
}

function subscribeTransactions(user) {
  currentTransactions = getDemoTransactions()
    .filter((item) => item.userId === user.uid)
    .sort((a, b) => {
      if (a.date === b.date) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return b.date.localeCompare(a.date);
    });

  const draw = () => {
    updateKpis(currentTransactions);
    renderHistory(currentTransactions, filterDateInput ? filterDateInput.value : "");
  };

  draw();

  if (filterDateInput) {
    filterDateInput.oninput = draw;
  }
}

function initDemoApp() {
  if (!loginForm || !transactionForm || !logoutBtn) {
    return;
  }

  const savedUser = getDemoSession();

  if (savedUser?.uid && savedUser?.email) {
    demoAuth.currentUser = savedUser;
    setLoggedView(savedUser);
    subscribeTransactions(savedUser);
  } else {
    setLoggedView(null);
    showLocalModeMessage("Acesso imediato liberado para teste.");
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const email = sanitizeEmail(emailField ? emailField.value : "");
    const password = passwordField ? passwordField.value.trim() : "";

    if (!email || !password) {
      if (authFeedback) {
        authFeedback.textContent = "Informe um email e uma senha v\u00e1lidos.";
      }
      return;
    }

    const users = getDemoUsers();
    const existing = users[email];

    if (!existing) {
      users[email] = { password };
      setDemoUsers(users);
    } else if (existing.password !== password) {
      if (authFeedback) {
        authFeedback.textContent = "Senha incorreta para este email.";
      }
      return;
    }

    demoAuth.currentUser = { uid: email, email };
    saveDemoSession(demoAuth.currentUser);
    setLoggedView(demoAuth.currentUser);
    subscribeTransactions(demoAuth.currentUser);

    if (authFeedback) {
      authFeedback.textContent = "Acesso liberado no modo local.";
    }
  });

  transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const typeField = document.getElementById("type");
    const amountField = document.getElementById("amount");
    const categoryField = document.getElementById("category");
    const dateField = document.getElementById("date");

    const type = typeField ? typeField.value : "";
    const amount = Number(amountField ? amountField.value : 0);
    const category = String(categoryField ? categoryField.value : "").trim().slice(0, 60);
    const date = dateField ? dateField.value : "";

    if (!amount || amount <= 0 || !category || !date || !demoAuth.currentUser) {
      if (authFeedback && !demoAuth.currentUser) {
        authFeedback.textContent = "Fa\u00e7a login para registrar movimenta\u00e7\u00f5es.";
      }
      return;
    }

    const payload = {
      userId: demoAuth.currentUser.uid,
      type,
      amount,
      category,
      date,
      createdAt: new Date().toISOString()
    };

    const allTransactions = getDemoTransactions();
    allTransactions.unshift(payload);
    setDemoTransactions(allTransactions);
    subscribeTransactions(demoAuth.currentUser);

    transactionForm.reset();
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }
  });

  logoutBtn.addEventListener("click", () => {
    demoAuth.currentUser = null;
    currentTransactions = [];
    clearDemoSession();
    setLoggedView(null);
    showLocalModeMessage("Voc\u00ea saiu da demonstra\u00e7\u00e3o local.");
  });
}

function init() {
  bindWhatsAppTracking();
  initRevealAnimations();
  initDemoApp();
}

init();
