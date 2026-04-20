const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const yearEl = document.getElementById("year");
const authCard = document.getElementById("auth-card");
const appPanel = document.getElementById("app-panel");
const authFeedback = document.getElementById("auth-feedback");
const userEmail = document.getElementById("user-email");

const loginForm = document.getElementById("login-form");
const transactionForm = document.getElementById("transaction-form");
const logoutBtn = document.getElementById("logout-btn");
const filterDateInput = document.getElementById("filter-date");

const historyList = document.getElementById("history-list");
const summaryText = document.getElementById("monthly-summary");

const kpiIncome = document.getElementById("kpi-income");
const kpiExpense = document.getElementById("kpi-expense");
const kpiProfit = document.getElementById("kpi-profit");

yearEl.textContent = String(new Date().getFullYear());
document.getElementById("date").valueAsDate = new Date();

let app;
let auth;
let db;
let useDemoMode = true;
let unsubscribeTransactions = null;
let currentTransactions = [];
let firebaseApi = null;

const DEMO_USERS_KEY = "upgestor_demo_users_v1";
const DEMO_TRANSACTIONS_KEY = "upgestor_demo_transactions_v1";
const DEMO_SESSION_KEY = "upgestor_demo_session_v1";

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

function updateKpis(transactions) {
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
  summaryText.textContent = `Resumo mensal: Entradas ${formatCurrency(income)}, Saídas ${formatCurrency(
    expense
  )}, Lucro ${formatCurrency(profit)}.`;
}

function renderHistory(transactions, dateFilter = "") {
  historyList.innerHTML = "";
  const filtered = dateFilter
    ? transactions.filter((item) => item.date === dateFilter)
    : transactions;

  if (!filtered.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item";
    emptyItem.textContent = "Nenhuma movimentação encontrada.";
    historyList.appendChild(emptyItem);
    return;
  }

  filtered.forEach((item) => {
    const line = document.createElement("li");
    line.className = "history-item";
    line.innerHTML = `
      <strong class="${item.type}">${item.type === "income" ? "Entrada" : "Saída"}: ${formatCurrency(
      item.amount
    )}</strong>
      <div>${item.category}</div>
      <small>${parseDateString(item.date)}</small>
    `;
    historyList.appendChild(line);
  });
}

function setLoggedView(user) {
  if (user) {
    authCard.classList.add("hidden");
    appPanel.classList.remove("hidden");
    userEmail.textContent = user.email || "Usuário logado";
  } else {
    authCard.classList.remove("hidden");
    appPanel.classList.add("hidden");
    userEmail.textContent = "";
    historyList.innerHTML = "";
    kpiIncome.textContent = "R$ 0,00";
    kpiExpense.textContent = "R$ 0,00";
    kpiProfit.textContent = "R$ 0,00";
    summaryText.textContent = "Sem dados no mês atual.";
  }
}

const demoAuth = { currentUser: null };

function showLocalModeMessage(extra = "") {
  authFeedback.textContent =
    "Modo local ativo. Login e dados salvos neste navegador. Para acesso online em vários dispositivos, configure o Firebase no app.js." +
    (extra ? ` ${extra}` : "");
}

function subscribeTransactions(user) {
  if (unsubscribeTransactions) {
    unsubscribeTransactions();
    unsubscribeTransactions = null;
  }

  if (useDemoMode) {
    const draw = () => {
      updateKpis(currentTransactions);
      renderHistory(currentTransactions, filterDateInput.value);
    };

    currentTransactions = getDemoTransactions()
      .filter((item) => item.userId === user.uid)
      .sort((a, b) => b.date.localeCompare(a.date));

    draw();
    unsubscribeTransactions = () => {};
    filterDateInput.oninput = draw;
    return;
  }

  const transactionsRef = firebaseApi.collection(db, "transactions");
  const q = firebaseApi.query(
    transactionsRef,
    firebaseApi.where("userId", "==", user.uid),
    firebaseApi.orderBy("date", "desc")
  );

  unsubscribeTransactions = firebaseApi.onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => doc.data());
    updateKpis(transactions);
    renderHistory(transactions, filterDateInput.value);
    filterDateInput.oninput = () => renderHistory(transactions, filterDateInput.value);
  });
}

function startAuthFlow() {
  if (useDemoMode) {
    const savedUser = getDemoSession();
    if (savedUser?.uid && savedUser?.email) {
      demoAuth.currentUser = savedUser;
      setLoggedView(savedUser);
      subscribeTransactions(savedUser);
    } else {
      setLoggedView(null);
    }
  } else {
    firebaseApi.onAuthStateChanged(auth, (user) => {
      setLoggedView(user);
      if (user) {
        subscribeTransactions(user);
      } else if (unsubscribeTransactions) {
        unsubscribeTransactions();
      }
    });
  }
}

async function initBackend() {
  showLocalModeMessage("Acesso imediato liberado para demonstração.");
  startAuthFlow();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    if (useDemoMode) {
      const normalizedEmail = sanitizeEmail(email);
      if (!normalizedEmail || !password) {
        authFeedback.textContent = "Informe um email e senha válidos.";
        return;
      }

      const users = getDemoUsers();
      const existing = users[normalizedEmail];
      if (!existing) {
        users[normalizedEmail] = { password };
        setDemoUsers(users);
      } else if (existing.password !== password) {
        authFeedback.textContent = "Senha incorreta para este email.";
        return;
      }

      demoAuth.currentUser = { uid: normalizedEmail, email: normalizedEmail };
      saveDemoSession(demoAuth.currentUser);
      setLoggedView(demoAuth.currentUser);
      subscribeTransactions(demoAuth.currentUser);
      authFeedback.textContent = "Acesso liberado no modo local.";
      return;
    }

    await firebaseApi.signInWithEmailAndPassword(auth, email, password);
    authFeedback.textContent = "Login realizado com sucesso.";
  } catch (error) {
    if (!useDemoMode && error.code === "auth/invalid-credential") {
      try {
        await firebaseApi.createUserWithEmailAndPassword(auth, email, password);
        authFeedback.textContent = "Conta criada e acesso liberado.";
      } catch (createError) {
        authFeedback.textContent = "Não foi possível autenticar. Verifique os dados.";
      }
    } else {
      authFeedback.textContent = "Erro ao entrar. Tente novamente.";
    }
  }
});

transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
  const date = document.getElementById("date").value;

  if (!amount || !category || !date) {
    return;
  }

  const currentUser = useDemoMode ? demoAuth.currentUser : auth.currentUser;
  if (!currentUser) {
    authFeedback.textContent = "Faça login para registrar movimentações.";
    return;
  }

  const payload = {
    userId: currentUser.uid,
    type,
    amount,
    category,
    date,
    createdAt: new Date().toISOString()
  };

  try {
    if (useDemoMode) {
      const allTransactions = getDemoTransactions();
      allTransactions.unshift(payload);
      setDemoTransactions(allTransactions);
      currentTransactions = allTransactions
        .filter((item) => item.userId === currentUser.uid)
        .sort((a, b) => b.date.localeCompare(a.date));
      updateKpis(currentTransactions);
      renderHistory(currentTransactions, filterDateInput.value);
    } else {
      await firebaseApi.addDoc(firebaseApi.collection(db, "transactions"), {
        ...payload,
        createdAt: firebaseApi.serverTimestamp()
      });
    }
    transactionForm.reset();
    document.getElementById("date").valueAsDate = new Date();
  } catch (error) {
    console.error(error);
    authFeedback.textContent = "Não foi possível salvar a movimentação.";
  }
});

logoutBtn.addEventListener("click", async () => {
  if (useDemoMode) {
    demoAuth.currentUser = null;
    currentTransactions = [];
    clearDemoSession();
    setLoggedView(null);
    authFeedback.textContent = "Você saiu do sistema local.";
    return;
  }
  await firebaseApi.signOut(auth);
});

initBackend();
