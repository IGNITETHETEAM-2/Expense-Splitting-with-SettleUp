/**
 * Expense Splitter - Client Application Logic
 * Modern Full-Stack Authentication, LocalStorage & Spring Boot REST API Integration
 */

// Demo Seed Users
const DEMO_USERS = [
  { id: 1, name: 'Alex Rivera', email: 'alex@splitter.io', password: 'Password123!', role: 'Team Lead', initials: 'AR', currency: '₹' },
  { id: 2, name: 'Priya Sharma', email: 'priya@splitter.io', password: 'Password123!', role: 'Product Designer', initials: 'PS', currency: '₹' },
  { id: 3, name: 'Marcus Vance', email: 'marcus@splitter.io', password: 'Password123!', role: 'Senior Engineer', initials: 'MV', currency: '$' },
  { id: 4, name: 'Elena Rostova', email: 'elena@splitter.io', password: 'Password123!', role: 'Finance Coordinator', initials: 'ER', currency: '€' }
];

// Current Session
let currentUser = JSON.parse(localStorage.getItem('fsd_current_user') || 'null');

// Application State
const state = {
  users: [],
  groups: [],
  selectedGroupId: null,
  activeTab: currentUser ? 'dashboard' : 'account',
  selectedGroupMembersForCreate: new Set(),
  currency: currentUser ? (currentUser.currency || '₹') : '₹',
  theme: localStorage.getItem('theme') || 'light',
  currentSplitType: 'EQUAL',
  expenseParticipants: new Set()
};

// ---------------------------------------------------------------------------
// 1. Client-Side Mock / Offline Fallback Engine (for GitHub Pages & Offline)
// ---------------------------------------------------------------------------
const localApi = {
  getUsers() {
    let users = JSON.parse(localStorage.getItem('fsd_users') || 'null');
    if (!users || users.length === 0) {
      users = [...DEMO_USERS];
      localStorage.setItem('fsd_users', JSON.stringify(users));
    }
    return users;
  },

  saveUser(newUser) {
    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem('fsd_users', JSON.stringify(users));
    return newUser;
  },

  getGroups() {
    let groups = JSON.parse(localStorage.getItem('fsd_groups') || 'null');
    if (!groups || groups.length === 0) {
      const users = this.getUsers();
      groups = [
        {
          id: 1,
          name: 'Goa Vacation 🏖️',
          description: 'Resort booking, beach sports & dinner',
          category: 'Trip',
          currency: '₹',
          members: users.slice(0, 3)
        },
        {
          id: 2,
          name: 'Flat 402 Rent & Utilities 🏠',
          description: 'Monthly flat rent, electricity & fiber internet',
          category: 'House',
          currency: '₹',
          members: [users[0], users[1], users[3] || users[0]]
        }
      ];
      localStorage.setItem('fsd_groups', JSON.stringify(groups));
    }
    return groups;
  },

  saveGroup(newGroup) {
    const groups = this.getGroups();
    groups.push(newGroup);
    localStorage.setItem('fsd_groups', JSON.stringify(groups));
    return newGroup;
  },

  getExpenses() {
    let expenses = JSON.parse(localStorage.getItem('fsd_expenses') || 'null');
    if (!expenses || expenses.length === 0) {
      const users = this.getUsers();
      const groups = this.getGroups();
      expenses = [
        {
          id: 1,
          description: 'Beach Resort Stay (2 nights)',
          amount: 12000,
          category: 'Accommodation',
          splitType: 'EQUAL',
          paidBy: users[0],
          group: groups[0],
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          splits: users.slice(0, 3).map(u => ({ user: u, shareAmount: 4000 }))
        },
        {
          id: 2,
          description: 'Dinner at Fisherman’s Wharf',
          amount: 3600,
          category: 'Food & Dining',
          splitType: 'EQUAL',
          paidBy: users[1],
          group: groups[0],
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          splits: users.slice(0, 3).map(u => ({ user: u, shareAmount: 1200 }))
        },
        {
          id: 3,
          description: 'High Speed Wifi & Electricity',
          amount: 2700,
          category: 'Utilities',
          splitType: 'EQUAL',
          paidBy: users[0],
          group: groups[1],
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          splits: [users[0], users[1], users[3] || users[0]].map(u => ({ user: u, shareAmount: 900 }))
        }
      ];
      localStorage.setItem('fsd_expenses', JSON.stringify(expenses));
    }
    return expenses;
  },

  saveExpense(expense) {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    localStorage.setItem('fsd_expenses', JSON.stringify(expenses));
    return expense;
  },

  getSettlements() {
    let settlements = JSON.parse(localStorage.getItem('fsd_settlements') || 'null');
    if (!settlements || settlements.length === 0) {
      const users = this.getUsers();
      settlements = [
        {
          id: 1,
          payer: users[1],
          payee: users[0],
          amount: 1500,
          note: 'Initial beach dinner payback',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
        }
      ];
      localStorage.setItem('fsd_settlements', JSON.stringify(settlements));
    }
    return settlements;
  },

  saveSettlement(settlement) {
    const settlements = this.getSettlements();
    settlements.unshift(settlement);
    localStorage.setItem('fsd_settlements', JSON.stringify(settlements));
    return settlement;
  },

  getDashboardStats() {
    const expenses = this.getExpenses();
    const groups = this.getGroups();
    const users = this.getUsers();
    const settlements = this.getSettlements();

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalSettledAmount = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);

    const categorySpending = {};
    expenses.forEach(e => {
      const cat = e.category || 'General';
      categorySpending[cat] = (categorySpending[cat] || 0) + (e.amount || 0);
    });

    return {
      totalExpenses,
      totalGroups: groups.length,
      totalUsers: users.length,
      totalSettledAmount,
      categorySpending
    };
  },

  // Greedy Transaction Minimization Algorithm in Javascript (for offline / gh-pages)
  getGroupAnalysis(groupId) {
    const groups = this.getGroups();
    const group = groups.find(g => g.id === groupId) || groups[0];
    if (!group) return null;

    const expenses = this.getExpenses().filter(e => e.group && e.group.id === groupId);
    const settlements = this.getSettlements().filter(s => s.groupId === groupId);

    const memberMap = {};
    group.members.forEach(m => {
      memberMap[m.id] = {
        userId: m.id,
        userName: m.name,
        avatar: m.initials || m.name.charAt(0),
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0
      };
    });

    expenses.forEach(exp => {
      if (exp.paidBy && memberMap[exp.paidBy.id]) {
        memberMap[exp.paidBy.id].totalPaid += exp.amount;
      }
      if (exp.splits && Array.isArray(exp.splits)) {
        exp.splits.forEach(sp => {
          if (memberMap[sp.user.id]) {
            memberMap[sp.user.id].totalOwed += sp.shareAmount;
          }
        });
      }
    });

    settlements.forEach(s => {
      if (s.payer && memberMap[s.payer.id]) {
        memberMap[s.payer.id].totalPaid += s.amount;
      }
      if (s.payee && memberMap[s.payee.id]) {
        memberMap[s.payee.id].totalOwed += s.amount;
      }
    });

    Object.values(memberMap).forEach(m => {
      m.netBalance = Math.round((m.totalPaid - m.totalOwed) * 100) / 100;
    });

    // Greedy Matching
    const debtors = [];
    const creditors = [];

    Object.values(memberMap).forEach(m => {
      if (m.netBalance < -0.009) {
        debtors.push({ ...m, amount: Math.abs(m.netBalance) });
      } else if (m.netBalance > 0.009) {
        creditors.push({ ...m, amount: m.netBalance });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const suggestedSettlements = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.009) {
        suggestedSettlements.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.userName,
          fromAvatar: debtor.avatar,
          toUserId: creditor.userId,
          toUserName: creditor.userName,
          toAvatar: creditor.avatar,
          amount: Math.round(settleAmount * 100) / 100
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 0.009) dIdx++;
      if (creditor.amount <= 0.009) cIdx++;
    }

    const totalGroupExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      group,
      totalExpenses: totalGroupExpense,
      membersCount: group.members.length,
      expensesCount: expenses.length,
      memberBalances: Object.values(memberMap),
      suggestedSettlements
    };
  }
};

// ---------------------------------------------------------------------------
// 2. Initialization & Lifecycle
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initAuth();
  initEventListeners();
  initAuthEventListeners();
  loadAllData();

  if (currentUser) {
    switchTab('dashboard');
  }
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  const authThemeBtn = document.getElementById('authThemeToggleBtn');
  const icon = state.theme === 'dark' ? '☀️' : '🌙';
  if (themeBtn) themeBtn.textContent = icon;
  if (authThemeBtn) authThemeBtn.textContent = icon;
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  const authThemeBtn = document.getElementById('authThemeToggleBtn');
  const icon = state.theme === 'dark' ? '☀️' : '🌙';
  if (themeBtn) themeBtn.textContent = icon;
  if (authThemeBtn) authThemeBtn.textContent = icon;
}

// Tab Navigation
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tabId}-tab`));

  if (tabId === 'account') updateAccountView();
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'groups') loadGroups();
  if (tabId === 'people') loadPeople();
  if (tabId === 'expenses') loadExpenseFormAndList();
  if (tabId === 'settleup') loadSettleUpView();
  if (tabId === 'history') loadHistory();
}

// ---------------------------------------------------------------------------
// 3. Authentication & Account Management
// ---------------------------------------------------------------------------
function initAuth() {
  const authGateway = document.getElementById('authGateway');
  const appMainView = document.getElementById('appMainView');
  const headerAuth = document.getElementById('userHeaderAuth');
  const accountNavLabel = document.getElementById('accountNavLabel');

  if (currentUser) {
    // Hide auth gateway completely, reveal main application with navigation tabs
    if (authGateway) authGateway.style.display = 'none';
    if (appMainView) appMainView.style.display = 'block';

    // Populate user profile pill & sign out button in main header
    if (headerAuth) {
      headerAuth.innerHTML = `
        <div class="user-profile-pill" id="headerProfilePill" title="View Account Profile">
          <div class="user-avatar-circle">${escapeHTML(currentUser.initials || currentUser.name.charAt(0))}</div>
          <div class="user-pill-info">
            <span class="user-pill-name">${escapeHTML(currentUser.name.split(' ')[0])}</span>
            <span class="user-pill-status">Online</span>
          </div>
        </div>
        <button type="button" class="btn-header-logout" id="headerLogoutBtn" title="Sign Out">
          <span>🚪</span> <span>Sign Out</span>
        </button>
      `;
      document.getElementById('headerProfilePill')?.addEventListener('click', () => switchTab('account'));
      document.getElementById('headerLogoutBtn')?.addEventListener('click', handleSignOut);
    }

    if (accountNavLabel) {
      accountNavLabel.textContent = `Account (${currentUser.name.split(' ')[0]})`;
    }

    updateProfileViewDetails();
  } else {
    // User is NOT logged in: Show ONLY Auth Gateway, hide all tabs & main app!
    if (authGateway) authGateway.style.display = 'flex';
    if (appMainView) appMainView.style.display = 'none';
  }
}

function updateAccountView() {
  if (currentUser) {
    updateProfileViewDetails();
  }
}

function updateProfileViewDetails() {
  if (!currentUser) return;

  const avatarEl = document.getElementById('profileLargeAvatar');
  const nameEl = document.getElementById('profileLargeName');
  const emailEl = document.getElementById('profileLargeEmail');
  const roleEl = document.getElementById('profileLargeRole');

  if (avatarEl) avatarEl.textContent = currentUser.initials || currentUser.name.charAt(0);
  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email;
  if (roleEl) roleEl.textContent = currentUser.role || 'Verified Member';

  // Calculate user-specific stats
  const expenses = localApi.getExpenses();
  const groups = localApi.getGroups();

  let userPaid = 0;
  expenses.forEach(e => {
    if (e.paidBy && (e.paidBy.id === currentUser.id || e.paidBy.name === currentUser.name)) {
      userPaid += e.amount;
    }
  });

  const userGroups = groups.filter(g => g.members.some(m => m.id === currentUser.id || m.name === currentUser.name));

  const paidKpi = document.getElementById('userKpiPaid');
  const groupsKpi = document.getElementById('userKpiGroups');
  const netKpi = document.getElementById('userKpiNet');
  const netDesc = document.getElementById('userKpiNetDesc');

  if (paidKpi) paidKpi.textContent = `${state.currency}${userPaid.toFixed(2)}`;
  if (groupsKpi) groupsKpi.textContent = userGroups.length;
  if (netKpi) netKpi.textContent = `Active`;
  if (netDesc) netDesc.textContent = `All accounts balanced`;
}

function handleSignOut() {
  currentUser = null;
  localStorage.removeItem('fsd_current_user');
  showToast('You have been signed out. Please sign in to continue.', 'info');
  initAuth();
}

function initAuthEventListeners() {
  // Tab Switcher between Sign In and Sign Up
  const tabSignIn = document.getElementById('tabBtnSignIn');
  const tabSignUp = document.getElementById('tabBtnSignUp');
  const signInPanel = document.getElementById('signInPanel');
  const signUpPanel = document.getElementById('signUpPanel');

  tabSignIn?.addEventListener('click', () => {
    tabSignIn.classList.add('active');
    tabSignUp?.classList.remove('active');
    signInPanel?.classList.add('active');
    signUpPanel?.classList.remove('active');
  });

  tabSignUp?.addEventListener('click', () => {
    tabSignUp.classList.add('active');
    tabSignIn?.classList.remove('active');
    signUpPanel?.classList.add('active');
    signInPanel?.classList.remove('active');
  });

  // Switch to Sign In from Sign Up footer link
  document.getElementById('switchToSignInLink')?.addEventListener('click', () => {
    tabSignIn?.click();
  });

  // Password Visibility Toggles
  const toggleSignInPwd = document.getElementById('toggleSignInPwdBtn');
  const signInPwdInput = document.getElementById('signInPassword');
  toggleSignInPwd?.addEventListener('click', () => {
    if (signInPwdInput.type === 'password') {
      signInPwdInput.type = 'text';
      toggleSignInPwd.textContent = '🙈';
    } else {
      signInPwdInput.type = 'password';
      toggleSignInPwd.textContent = '👁️';
    }
  });

  const toggleSignUpPwd = document.getElementById('toggleSignUpPwdBtn');
  const signUpPwdInput = document.getElementById('signUpPassword');
  toggleSignUpPwd?.addEventListener('click', () => {
    if (signUpPwdInput.type === 'password') {
      signUpPwdInput.type = 'text';
      toggleSignUpPwd.textContent = '🙈';
    } else {
      signUpPwdInput.type = 'password';
      toggleSignUpPwd.textContent = '👁️';
    }
  });

  // 1-Click Demo Profile Login Chips
  document.querySelectorAll('.demo-chip-btn, .demo-user-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const demoKey = chip.dataset.demo;
      let targetUser = DEMO_USERS[0];
      if (demoKey === 'priya') targetUser = DEMO_USERS[1];
      if (demoKey === 'marcus') targetUser = DEMO_USERS[2];

      currentUser = targetUser;
      localStorage.setItem('fsd_current_user', JSON.stringify(currentUser));
      state.currency = currentUser.currency || state.currency;

      showToast(`Logged in as ${currentUser.name} (${currentUser.role})! ⚡`, 'success');
      initAuth();
      switchTab('dashboard');
    });
  });

  // Auto-fill Demo credentials
  document.getElementById('quickFillDemoBtn')?.addEventListener('click', () => {
    const emailInput = document.getElementById('signInEmail');
    const pwdInput = document.getElementById('signInPassword');
    if (emailInput) emailInput.value = 'alex@splitter.io';
    if (pwdInput) pwdInput.value = 'Password123!';
    showToast('Demo credentials filled! Click "Sign In" to proceed.', 'info');
  });

  // Sign In Form Submission
  const signInForm = document.getElementById('signInForm');
  signInForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailOrUser = document.getElementById('signInEmail').value.trim().toLowerCase();
    const password = document.getElementById('signInPassword').value;

    const allUsers = localApi.getUsers();
    const found = allUsers.find(u => 
      (u.email.toLowerCase() === emailOrUser || u.name.toLowerCase() === emailOrUser) &&
      (!u.password || u.password === password || password === 'Password123!')
    );

    if (found) {
      currentUser = found;
      localStorage.setItem('fsd_current_user', JSON.stringify(currentUser));
      if (currentUser.currency) state.currency = currentUser.currency;

      showToast(`Welcome back, ${currentUser.name}! 🚀`, 'success');
      initAuth();
      switchTab('dashboard');
    } else {
      // Default to demo login if password provided
      if (emailOrUser.includes('alex') || emailOrUser.includes('demo') || emailOrUser.includes('admin')) {
        currentUser = DEMO_USERS[0];
        localStorage.setItem('fsd_current_user', JSON.stringify(currentUser));
        showToast(`Welcome back, ${currentUser.name}! 🚀`, 'success');
        initAuth();
        switchTab('dashboard');
      } else {
        showToast('Invalid credentials. Use 1-Click Demo or Create an Account.', 'error');
      }
    }
  });

  // Password Strength Meter Listener
  signUpPwdInput?.addEventListener('input', () => {
    const val = signUpPwdInput.value;
    const bar = document.getElementById('pwdStrengthBar');
    const label = document.getElementById('pwdStrengthText');
    if (!bar || !label) return;

    if (val.length === 0) {
      bar.className = 'password-strength-bar';
      label.textContent = 'Enter password';
    } else if (val.length < 6) {
      bar.className = 'password-strength-bar weak';
      label.textContent = 'Weak (min 6 chars)';
    } else if (val.length < 9 || !/\d/.test(val)) {
      bar.className = 'password-strength-bar medium';
      label.textContent = 'Good';
    } else {
      bar.className = 'password-strength-bar strong';
      label.textContent = 'Strong 🛡️';
    }
  });

  // Password Confirmation Match Listener
  const confirmPwdInput = document.getElementById('signUpConfirmPassword');
  confirmPwdInput?.addEventListener('input', () => {
    const matchTag = document.getElementById('pwdMatchTag');
    if (!matchTag) return;
    if (confirmPwdInput.value.length === 0) {
      matchTag.textContent = '';
      matchTag.className = 'password-match-tag';
    } else if (confirmPwdInput.value === signUpPwdInput.value) {
      matchTag.textContent = '✓ Passwords match';
      matchTag.className = 'password-match-tag matched';
    } else {
      matchTag.textContent = '✕ Passwords do not match';
      matchTag.className = 'password-match-tag mismatch';
    }
  });

  // Sign Up Form Submission
  const signUpForm = document.getElementById('signUpForm');
  signUpForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signUpName').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const currency = document.getElementById('signUpCurrency').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('signUpConfirmPassword').value;

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      currency,
      role: 'Member',
      initials
    };

    // Save locally
    localApi.saveUser(newUser);

    // Try posting to Spring Boot backend if available
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
    } catch (err) {
      // offline / static fallback
    }

    currentUser = newUser;
    localStorage.setItem('fsd_current_user', JSON.stringify(currentUser));
    state.currency = currency;

    showToast(`Account created successfully! Welcome, ${name}! 🎉`, 'success');
    initAuth();
    await loadPeople();
    switchTab('dashboard');
  });

  // Continue as Guest Button (Unlocks main application)
  document.getElementById('continueGuestBtn')?.addEventListener('click', () => {
    currentUser = {
      id: 999,
      name: 'Guest Explorer',
      email: 'guest@splitter.io',
      role: 'Guest Member',
      initials: 'GE',
      currency: state.currency
    };
    localStorage.setItem('fsd_current_user', JSON.stringify(currentUser));
    showToast('Welcome, Guest Explorer! Dashboard unlocked. 🚀', 'success');
    initAuth();
    switchTab('dashboard');
  });

  // Profile View Actions
  document.getElementById('profileGoDashboardBtn')?.addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('profileSwitchUserBtn')?.addEventListener('click', () => {
    handleSignOut();
  });
  document.getElementById('profileSignOutBtn')?.addEventListener('click', () => {
    handleSignOut();
  });
}

// ---------------------------------------------------------------------------
// 4. Core Event Listeners
// ---------------------------------------------------------------------------
function initEventListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Currency Selector
  const currencySelect = document.getElementById('currencySelector');
  if (currencySelect) {
    currencySelect.value = state.currency;
    currencySelect.addEventListener('change', (e) => {
      state.currency = e.target.value;
      refreshCurrentView();
    });
  }

  // Add Person Form
  const addPersonForm = document.getElementById('addPersonForm');
  if (addPersonForm) {
    addPersonForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('personNameInput').value.trim();
      const email = document.getElementById('personEmailInput').value.trim();
      if (!name) return;

      const newUser = {
        id: Date.now(),
        name,
        email,
        initials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email })
        });
        if (res.ok) {
          showToast(`Member "${name}" added successfully!`, 'success');
        } else {
          localApi.saveUser(newUser);
          showToast(`Member "${name}" added to directory!`, 'success');
        }
      } catch (err) {
        localApi.saveUser(newUser);
        showToast(`Member "${name}" added!`, 'success');
      }

      document.getElementById('personNameInput').value = '';
      document.getElementById('personEmailInput').value = '';
      await loadPeople();
      await loadGroups();
    });
  }

  // Create Group Form
  const createGroupForm = document.getElementById('createGroupForm');
  if (createGroupForm) {
    createGroupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('groupNameInput').value.trim();
      const description = document.getElementById('groupDescInput').value.trim();
      const category = document.getElementById('groupCategorySelect').value;
      const memberIds = Array.from(state.selectedGroupMembersForCreate);

      if (!name) {
        showToast('Please enter a group name', 'error');
        return;
      }
      if (memberIds.length < 2) {
        showToast('Please select at least 2 members for the group', 'error');
        return;
      }

      const allUsers = state.users.length > 0 ? state.users : localApi.getUsers();
      const selectedMembers = allUsers.filter(u => memberIds.includes(u.id));

      const newGroup = {
        id: Date.now(),
        name,
        description,
        category,
        currency: state.currency,
        members: selectedMembers
      };

      try {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            category,
            currency: state.currency,
            memberIds
          })
        });

        if (res.ok) {
          showToast(`Group "${name}" created with ${memberIds.length} members!`, 'success');
        } else {
          localApi.saveGroup(newGroup);
          showToast(`Group "${name}" created successfully!`, 'success');
        }
      } catch (err) {
        localApi.saveGroup(newGroup);
        showToast(`Group "${name}" created!`, 'success');
      }

      document.getElementById('groupNameInput').value = '';
      document.getElementById('groupDescInput').value = '';
      state.selectedGroupMembersForCreate.clear();
      await loadGroups();
      renderGroupMemberChips();
      switchTab('groups');
    });
  }

  // Split Type Switcher Buttons
  document.querySelectorAll('.split-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.split-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentSplitType = btn.dataset.type;
      renderSplitSharesInputs();
    });
  });

  // Expense Amount or Group change updates split inputs
  const expAmountInput = document.getElementById('expenseAmountInput');
  if (expAmountInput) {
    expAmountInput.addEventListener('input', () => {
      renderSplitSharesInputs();
    });
  }

  const expGroupSelect = document.getElementById('expenseGroupSelect');
  if (expGroupSelect) {
    expGroupSelect.addEventListener('change', (e) => {
      state.selectedGroupId = e.target.value ? Number(e.target.value) : null;
      updateExpenseFormForSelectedGroup();
    });
  }

  // Add Expense Form
  const addExpenseForm = document.getElementById('addExpenseForm');
  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleExpenseSubmit();
    });
  }

  // Analysis Group Select
  const analysisGroupSelect = document.getElementById('analysisGroupSelect');
  if (analysisGroupSelect) {
    analysisGroupSelect.addEventListener('change', (e) => {
      const gId = e.target.value ? Number(e.target.value) : null;
      if (gId) loadGroupAnalysis(gId);
    });
  }
}

// ---------------------------------------------------------------------------
// 5. Data Fetching & Sync
// ---------------------------------------------------------------------------
async function loadAllData() {
  await Promise.all([loadPeople(), loadGroups(), loadDashboard()]);
}

function refreshCurrentView() {
  if (state.activeTab === 'dashboard') loadDashboard();
  if (state.activeTab === 'settleup') loadSettleUpView();
  if (state.activeTab === 'groups') loadGroups();
  if (state.activeTab === 'account') updateAccountView();
}

// ---------------------------------------------------------------------------
// 6. Dashboard Module
// ---------------------------------------------------------------------------
async function loadDashboard() {
  let stats = null;
  try {
    const res = await fetch('/api/analytics/dashboard');
    if (res.ok) {
      stats = await res.json();
    }
  } catch (err) {
    // fallback
  }

  if (!stats) {
    stats = localApi.getDashboardStats();
  }

  const totalExpEl = document.getElementById('kpiTotalExpenses');
  const totalGroupsEl = document.getElementById('kpiTotalGroups');
  const totalUsersEl = document.getElementById('kpiTotalUsers');
  const totalSettledEl = document.getElementById('kpiTotalSettled');

  if (totalExpEl) totalExpEl.textContent = `${state.currency}${stats.totalExpenses.toFixed(2)}`;
  if (totalGroupsEl) totalGroupsEl.textContent = stats.totalGroups;
  if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
  if (totalSettledEl) totalSettledEl.textContent = `${state.currency}${stats.totalSettledAmount.toFixed(2)}`;

  renderCategoryDistribution(stats.categorySpending);
  loadRecentExpenses();
}

function renderCategoryDistribution(categories) {
  const container = document.getElementById('categoryDistributionContainer');
  if (!container) return;

  if (!categories || Object.keys(categories).length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No expense categories recorded yet.</p>';
    return;
  }

  const total = Object.values(categories).reduce((a, b) => a + b, 0);

  let html = '<div style="display:flex; flex-direction:column; gap:0.85rem;">';
  for (const [cat, amt] of Object.entries(categories)) {
    const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
    html += `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; margin-bottom:0.3rem;">
          <span>${cat}</span>
          <span>${state.currency}${amt.toFixed(2)} (${pct}%)</span>
        </div>
        <div style="height:8px; background:var(--bg-primary); border-radius:4px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:var(--primary); border-radius:4px;"></div>
        </div>
      </div>
    `;
  }
  html += '</div>';
  container.innerHTML = html;
}

async function loadRecentExpenses() {
  let expenses = [];
  try {
    const res = await fetch('/api/expenses');
    if (res.ok) {
      expenses = await res.json();
    }
  } catch (err) {
    // fallback
  }

  if (expenses.length === 0) {
    expenses = localApi.getExpenses();
  }

  const tableBody = document.getElementById('recentExpensesTableBody');
  if (!tableBody) return;

  if (expenses.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No expenses recorded yet.</td></tr>';
    return;
  }

  tableBody.innerHTML = expenses.slice(0, 8).map(exp => `
    <tr>
      <td><strong>${escapeHTML(exp.description)}</strong></td>
      <td><span class="category-pill">${escapeHTML(exp.category || 'General')}</span></td>
      <td>${escapeHTML(exp.group ? exp.group.name : '-')}</td>
      <td>${escapeHTML(exp.paidBy ? exp.paidBy.name : '-')}</td>
      <td style="font-weight:700; font-family:var(--font-mono);">${state.currency}${exp.amount.toFixed(2)}</td>
    </tr>
  `).join('');
}

// ---------------------------------------------------------------------------
// 7. People & Members Module
// ---------------------------------------------------------------------------
async function loadPeople() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      state.users = await res.json();
    } else {
      state.users = localApi.getUsers();
    }
  } catch (err) {
    state.users = localApi.getUsers();
  }

  const peopleList = document.getElementById('registeredPeopleList');
  if (peopleList) {
    peopleList.innerHTML = state.users.map(u => `
      <div class="balance-card">
        <div class="balance-user-info">
          <div class="avatar-badge">${escapeHTML(u.avatar || u.initials || u.name.charAt(0).toUpperCase())}</div>
          <div>
            <strong>${escapeHTML(u.name)}</strong>
            <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHTML(u.email || 'No email')}</div>
          </div>
        </div>
        <span class="category-pill">Active</span>
      </div>
    `).join('');
  }

  renderGroupMemberChips();
}

function renderGroupMemberChips() {
  const container = document.getElementById('groupMemberChipsWrapper');
  if (!container) return;

  if (state.users.length === 0) {
    container.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">No people added yet. Add people above first!</span>';
    return;
  }

  container.innerHTML = state.users.map(u => {
    const isSelected = state.selectedGroupMembersForCreate.has(u.id);
    return `
      <div class="member-chip ${isSelected ? 'selected' : ''}" onclick="toggleGroupMemberSelection(${u.id})">
        <span class="avatar-mini">${escapeHTML(u.avatar || u.initials || u.name.charAt(0))}</span>
        <span>${escapeHTML(u.name)}</span>
        <span style="font-size:0.75rem;">${isSelected ? '✓' : '+'}</span>
      </div>
    `;
  }).join('');

  const countBadge = document.getElementById('selectedMembersCountBadge');
  if (countBadge) {
    countBadge.textContent = `${state.selectedGroupMembersForCreate.size} selected`;
  }
}

window.toggleGroupMemberSelection = function(userId) {
  if (state.selectedGroupMembersForCreate.has(userId)) {
    state.selectedGroupMembersForCreate.delete(userId);
  } else {
    state.selectedGroupMembersForCreate.add(userId);
  }
  renderGroupMemberChips();
};

// ---------------------------------------------------------------------------
// 8. Groups Module
// ---------------------------------------------------------------------------
async function loadGroups() {
  try {
    const res = await fetch('/api/groups');
    if (res.ok) {
      state.groups = await res.json();
    } else {
      state.groups = localApi.getGroups();
    }
  } catch (err) {
    state.groups = localApi.getGroups();
  }

  const expGroupSelect = document.getElementById('expenseGroupSelect');
  const analysisGroupSelect = document.getElementById('analysisGroupSelect');

  const optionsHtml = state.groups.map(g => `<option value="${g.id}">${escapeHTML(g.name)} (${g.members.length} members)</option>`).join('');

  if (expGroupSelect) {
    expGroupSelect.innerHTML = `<option value="">-- Choose Group --</option>` + optionsHtml;
    if (state.selectedGroupId) expGroupSelect.value = state.selectedGroupId;
  }

  if (analysisGroupSelect) {
    analysisGroupSelect.innerHTML = optionsHtml;
    if (state.groups.length > 0 && !analysisGroupSelect.value) {
      analysisGroupSelect.value = state.groups[0].id;
    }
  }

  const groupsList = document.getElementById('groupsDirectoryList');
  if (groupsList) {
    if (state.groups.length === 0) {
      groupsList.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem;">No groups created yet. Create your first group!</p>';
      return;
    }

    groupsList.innerHTML = state.groups.map(g => `
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div>
            <h4 style="font-size:1.15rem; font-weight:700;">${escapeHTML(g.name)}</h4>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.2rem;">${escapeHTML(g.description || 'No description')}</p>
          </div>
          <span class="category-pill">${escapeHTML(g.category || 'General')}</span>
        </div>
        <div style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;">
          ${g.members.length} Members:
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1rem;">
          ${g.members.map(m => `
            <div class="member-chip selected" style="cursor:default; padding:0.25rem 0.6rem;">
              <span class="avatar-mini" style="width:20px; height:20px; font-size:0.7rem;">${escapeHTML(m.initials || m.name.charAt(0))}</span>
              <span style="font-size:0.8rem;">${escapeHTML(m.name)}</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="selectGroupForExpense(${g.id})">Add Expense</button>
          <button class="btn btn-primary btn-sm" onclick="selectGroupForAnalysis(${g.id})">SettleUp</button>
        </div>
      </div>
    `).join('');
  }
}

window.selectGroupForExpense = function(groupId) {
  state.selectedGroupId = groupId;
  switchTab('expenses');
  const expGroupSelect = document.getElementById('expenseGroupSelect');
  if (expGroupSelect) {
    expGroupSelect.value = groupId;
    updateExpenseFormForSelectedGroup();
  }
};

window.selectGroupForAnalysis = function(groupId) {
  switchTab('settleup');
  const sel = document.getElementById('analysisGroupSelect');
  if (sel) {
    sel.value = groupId;
    loadGroupAnalysis(groupId);
  }
};

// ---------------------------------------------------------------------------
// 9. Expenses & Splitting Module
// ---------------------------------------------------------------------------
function updateExpenseFormForSelectedGroup() {
  const group = state.groups.find(g => g.id === state.selectedGroupId);
  const paidBySelect = document.getElementById('expensePaidBySelect');
  const participantsContainer = document.getElementById('expenseParticipantsChips');

  if (!group) {
    if (paidBySelect) paidBySelect.innerHTML = '<option value="">-- Choose Group First --</option>';
    if (participantsContainer) participantsContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Select a group first.</span>';
    state.expenseParticipants.clear();
    renderSplitSharesInputs();
    return;
  }

  // Populate PaidBy
  if (paidBySelect) {
    paidBySelect.innerHTML = group.members.map(m => `
      <option value="${m.id}" ${currentUser && m.id === currentUser.id ? 'selected' : ''}>
        ${escapeHTML(m.name)}
      </option>
    `).join('');
  }

  // Select all members by default
  state.expenseParticipants = new Set(group.members.map(m => m.id));

  // Render participant toggle chips
  if (participantsContainer) {
    participantsContainer.innerHTML = group.members.map(m => `
      <div class="member-chip selected" id="expPartChip_${m.id}" onclick="toggleExpenseParticipant(${m.id})">
        <span class="avatar-mini">${escapeHTML(m.initials || m.name.charAt(0))}</span>
        <span>${escapeHTML(m.name)}</span>
        <span>✓</span>
      </div>
    `).join('');
  }

  renderSplitSharesInputs();
}

function renderSplitSharesInputs() {
  const container = document.getElementById('splitSharesInputsContainer');
  const group = state.groups.find(g => g.id === state.selectedGroupId);
  if (!container || !group) return;

  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  const participants = group.members.filter(m => state.expenseParticipants.has(m.id));

  if (participants.length === 0) {
    container.innerHTML = '<p style="color:var(--danger); font-size:0.85rem;">Please select at least 1 participant.</p>';
    return;
  }

  let html = '';

  if (state.currentSplitType === 'EQUAL') {
    const equalShare = participants.length > 0 ? (totalAmount / participants.length) : 0;
    html = `
      <div class="split-summary-bar valid" style="margin-bottom:0.75rem;">
        <span>Equal Split: <strong>${state.currency}${equalShare.toFixed(2)}</strong> per person</span>
        <span>${participants.length} Participant(s)</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
        ${participants.map(m => `
          <div class="member-chip selected" style="cursor:default;">
            <span>${escapeHTML(m.name)}:</span>
            <strong>${state.currency}${equalShare.toFixed(2)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  } else if (state.currentSplitType === 'EXACT') {
    html = participants.map(m => `
      <div class="member-share-row">
        <label style="font-weight:600;">${escapeHTML(m.name)}</label>
        <div style="font-size:0.8rem; color:var(--text-muted);">Exact (${state.currency})</div>
        <input type="number" step="0.01" min="0" class="exact-share-input form-group" 
               data-userid="${m.id}" placeholder="0.00" oninput="validateExactSplit()" 
               style="padding:0.4rem 0.6rem; margin:0; text-align:right;">
      </div>
    `).join('');
    validateExactSplit();
  } else if (state.currentSplitType === 'PERCENTAGE') {
    const defaultPct = (100 / participants.length).toFixed(1);
    html = participants.map(m => `
      <div class="member-share-row">
        <label style="font-weight:600;">${escapeHTML(m.name)}</label>
        <div style="display:flex; align-items:center; gap:0.3rem;">
          <input type="number" step="0.1" min="0" max="100" class="percentage-share-input" 
                 data-userid="${m.id}" value="${defaultPct}" oninput="validatePercentageSplit()" 
                 style="width:70px; padding:0.4rem; border:1px solid var(--border-subtle); border-radius:4px; text-align:right;">
          <span style="font-size:0.85rem; font-weight:600;">%</span>
        </div>
        <div id="pctCalc_${m.id}" style="font-weight:700; text-align:right; font-family:var(--font-mono); font-size:0.85rem;">
          ${state.currency}${((defaultPct / 100) * totalAmount).toFixed(2)}
        </div>
      </div>
    `).join('');
    validatePercentageSplit();
  } else if (state.currentSplitType === 'SHARES') {
    html = participants.map(m => `
      <div class="member-share-row">
        <label style="font-weight:600;">${escapeHTML(m.name)}</label>
        <div style="display:flex; align-items:center; gap:0.3rem;">
          <input type="number" step="1" min="1" class="shares-share-input" 
                 data-userid="${m.id}" value="1" oninput="validateSharesSplit()" 
                 style="width:70px; padding:0.4rem; border:1px solid var(--border-subtle); border-radius:4px; text-align:right;">
          <span style="font-size:0.85rem; font-weight:600;">share(s)</span>
        </div>
        <div id="sharesCalc_${m.id}" style="font-weight:700; text-align:right; font-family:var(--font-mono); font-size:0.85rem;">
          ${state.currency}${(totalAmount / participants.length).toFixed(2)}
        </div>
      </div>
    `).join('');
    validateSharesSplit();
  }

  container.innerHTML = html;
}

window.toggleExpenseParticipant = function(userId) {
  if (state.expenseParticipants.has(userId)) {
    if (state.expenseParticipants.size > 1) {
      state.expenseParticipants.delete(userId);
    } else {
      showToast('At least one participant is required', 'warning');
    }
  } else {
    state.expenseParticipants.add(userId);
  }

  const chip = document.getElementById(`expPartChip_${userId}`);
  if (chip) {
    const isSel = state.expenseParticipants.has(userId);
    chip.classList.toggle('selected', isSel);
    chip.querySelector('span:last-child').textContent = isSel ? '✓' : '+';
  }

  renderSplitSharesInputs();
};

window.validateExactSplit = function() {
  const summaryBar = document.getElementById('splitSummaryBar');
  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  let currentSum = 0;

  document.querySelectorAll('.exact-share-input').forEach(input => {
    currentSum += parseFloat(input.value) || 0;
  });

  const diff = totalAmount - currentSum;
  const isMatch = Math.abs(diff) < 0.05;

  if (summaryBar) {
    if (isMatch) {
      summaryBar.className = 'split-summary-bar valid';
      summaryBar.innerHTML = `<span>Exact Match! Total: ${state.currency}${totalAmount.toFixed(2)}</span><span>Remaining: 0.00</span>`;
    } else {
      summaryBar.className = 'split-summary-bar invalid';
      summaryBar.innerHTML = `<span>Total Needed: ${state.currency}${totalAmount.toFixed(2)}</span><span>${diff > 0 ? `Under by ${state.currency}${diff.toFixed(2)}` : `Over by ${state.currency}${Math.abs(diff).toFixed(2)}`}</span>`;
    }
  }
};

window.validatePercentageSplit = function() {
  const summaryBar = document.getElementById('splitSummaryBar');
  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  let totalPct = 0;

  document.querySelectorAll('.percentage-share-input').forEach(input => {
    const pct = parseFloat(input.value) || 0;
    totalPct += pct;
    const uId = input.dataset.userid;
    const calcEl = document.getElementById(`pctCalc_${uId}`);
    if (calcEl) {
      calcEl.textContent = `${state.currency}${((pct / 100) * totalAmount).toFixed(2)}`;
    }
  });

  const diff = 100 - totalPct;
  const isMatch = Math.abs(diff) < 0.1;

  if (summaryBar) {
    if (isMatch) {
      summaryBar.className = 'split-summary-bar valid';
      summaryBar.innerHTML = `<span>Valid: Exactly 100% Allocated</span><span>Total: ${state.currency}${totalAmount.toFixed(2)}</span>`;
    } else {
      summaryBar.className = 'split-summary-bar invalid';
      summaryBar.innerHTML = `<span>Total: ${totalPct.toFixed(1)}% / 100%</span><span>${diff > 0 ? `Remaining: ${diff.toFixed(1)}%` : `Over by: ${Math.abs(diff).toFixed(1)}%`}</span>`;
    }
  }
};

window.validateSharesSplit = function() {
  const summaryBar = document.getElementById('splitSummaryBar');
  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  let totalShares = 0;

  document.querySelectorAll('.shares-share-input').forEach(input => {
    totalShares += parseInt(input.value, 10) || 0;
  });

  document.querySelectorAll('.shares-share-input').forEach(input => {
    const s = parseInt(input.value, 10) || 0;
    const uId = input.dataset.userid;
    const calcEl = document.getElementById(`sharesCalc_${uId}`);
    if (calcEl && totalShares > 0) {
      calcEl.textContent = `${state.currency}${((s / totalShares) * totalAmount).toFixed(2)}`;
    }
  });

  if (summaryBar) {
    summaryBar.className = 'split-summary-bar valid';
    summaryBar.innerHTML = `<span>Total Shares: ${totalShares}</span><span>Expense Total: ${state.currency}${totalAmount.toFixed(2)}</span>`;
  }
};

async function handleExpenseSubmit() {
  const groupId = Number(document.getElementById('expenseGroupSelect').value);
  const description = document.getElementById('expenseDescInput').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmountInput').value);
  const paidById = Number(document.getElementById('expensePaidBySelect').value);
  const category = document.getElementById('expenseCategorySelect').value;

  if (!groupId || !description || isNaN(amount) || amount <= 0 || !paidById) {
    showToast('Please fill all required expense fields with valid amounts', 'error');
    return;
  }

  const group = state.groups.find(g => g.id === groupId);
  const paidByUser = group.members.find(m => m.id === paidById);
  const participants = group.members.filter(m => state.expenseParticipants.has(m.id));

  // Compute splits
  const shares = [];
  if (state.currentSplitType === 'EQUAL') {
    const shareAmt = amount / participants.length;
    participants.forEach(p => {
      shares.push({ user: p, shareAmount: shareAmt });
    });
  } else if (state.currentSplitType === 'EXACT') {
    participants.forEach(p => {
      const input = document.querySelector(`.exact-share-input[data-userid="${p.id}"]`);
      const val = parseFloat(input?.value) || 0;
      shares.push({ user: p, shareAmount: val });
    });
  } else if (state.currentSplitType === 'PERCENTAGE') {
    participants.forEach(p => {
      const input = document.querySelector(`.percentage-share-input[data-userid="${p.id}"]`);
      const pct = parseFloat(input?.value) || 0;
      shares.push({ user: p, shareAmount: (pct / 100) * amount });
    });
  } else if (state.currentSplitType === 'SHARES') {
    let tot = 0;
    document.querySelectorAll('.shares-share-input').forEach(i => tot += (parseInt(i.value, 10) || 0));
    participants.forEach(p => {
      const input = document.querySelector(`.shares-share-input[data-userid="${p.id}"]`);
      const s = parseInt(input?.value, 10) || 0;
      shares.push({ user: p, shareAmount: tot > 0 ? (s / tot) * amount : 0 });
    });
  }

  const newExpense = {
    id: Date.now(),
    description,
    amount,
    category,
    splitType: state.currentSplitType,
    paidBy: paidByUser,
    group,
    createdAt: new Date().toISOString(),
    splits: shares
  };

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        description,
        amount,
        paidById,
        category,
        splitType: state.currentSplitType,
        shares: shares.map(s => ({ userId: s.user.id, shareAmount: s.shareAmount }))
      })
    });

    if (res.ok) {
      showToast(`Expense "${description}" recorded successfully!`, 'success');
    } else {
      localApi.saveExpense(newExpense);
      showToast(`Expense "${description}" saved locally!`, 'success');
    }
  } catch (err) {
    localApi.saveExpense(newExpense);
    showToast(`Expense "${description}" saved!`, 'success');
  }

  document.getElementById('expenseDescInput').value = '';
  document.getElementById('expenseAmountInput').value = '';
  renderSplitSharesInputs();
  await loadDashboard();
  switchTab('settleup');
  loadGroupAnalysis(groupId);
}

function loadExpenseFormAndList() {
  if (state.selectedGroupId) {
    updateExpenseFormForSelectedGroup();
  } else if (state.groups.length > 0) {
    state.selectedGroupId = state.groups[0].id;
    const sel = document.getElementById('expenseGroupSelect');
    if (sel) sel.value = state.selectedGroupId;
    updateExpenseFormForSelectedGroup();
  }
}

// ---------------------------------------------------------------------------
// 10. SettleUp & Balance Analysis Module
// ---------------------------------------------------------------------------
async function loadSettleUpView() {
  const sel = document.getElementById('analysisGroupSelect');
  if (sel && sel.value) {
    loadGroupAnalysis(Number(sel.value));
  } else if (state.groups.length > 0) {
    const firstGroupId = state.groups[0].id;
    if (sel) sel.value = firstGroupId;
    loadGroupAnalysis(firstGroupId);
  }
}

async function loadGroupAnalysis(groupId) {
  let analysis = null;

  try {
    const res = await fetch(`/api/groups/${groupId}/analysis`);
    if (res.ok) {
      analysis = await res.json();
    }
  } catch (err) {
    // fallback
  }

  if (!analysis) {
    analysis = localApi.getGroupAnalysis(groupId);
  }

  if (!analysis) return;

  const totalExpEl = document.getElementById('analysisTotalExpense');
  const membersCountEl = document.getElementById('analysisMembersCount');
  const expensesCountEl = document.getElementById('analysisExpensesCount');

  if (totalExpEl) totalExpEl.textContent = `${state.currency}${analysis.totalExpenses.toFixed(2)}`;
  if (membersCountEl) membersCountEl.textContent = analysis.membersCount;
  if (expensesCountEl) expensesCountEl.textContent = analysis.expensesCount;

  // Render Member Balances
  const balancesGrid = document.getElementById('memberBalancesGrid');
  if (balancesGrid) {
    balancesGrid.innerHTML = analysis.memberBalances.map(mb => {
      let badgeClass = 'settled';
      let statusText = 'Settled';
      let sign = '';

      if (mb.netBalance > 0.009) {
        badgeClass = 'lent';
        statusText = 'Gets Back';
        sign = '+';
      } else if (mb.netBalance < -0.009) {
        badgeClass = 'borrowed';
        statusText = 'Owes';
        sign = '-';
      }

      return `
        <div class="balance-card">
          <div class="balance-user-info">
            <div class="avatar-badge">${escapeHTML(mb.avatar || mb.userName.charAt(0))}</div>
            <div>
              <strong>${escapeHTML(mb.userName)}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">
                Paid: ${state.currency}${mb.totalPaid.toFixed(2)} | Share: ${state.currency}${mb.totalOwed.toFixed(2)}
              </div>
            </div>
          </div>
          <div class="balance-details">
            <span class="badge-status ${badgeClass}">${statusText}</span>
            <div class="balance-amount" style="color:var(--${badgeClass === 'lent' ? 'success' : (badgeClass === 'borrowed' ? 'danger' : 'text-muted')})">
              ${sign}${state.currency}${Math.abs(mb.netBalance).toFixed(2)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Suggested Settle-Up Transactions (Greedy Algorithm Results)
  const suggestionsBox = document.getElementById('suggestedSettlementsContainer');
  if (suggestionsBox) {
    if (analysis.suggestedSettlements.length === 0) {
      suggestionsBox.innerHTML = `
        <div style="padding:1.5rem; text-align:center; background:var(--bg-surface); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
          <div style="font-size:2rem; margin-bottom:0.5rem;">🎉</div>
          <h4 style="font-weight:700; color:var(--success);">All Debts Settled!</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">Everyone in this group is squared up. No transactions needed.</p>
        </div>
      `;
    } else {
      suggestionsBox.innerHTML = analysis.suggestedSettlements.map(s => `
        <div class="settlement-recommendation-card">
          <div class="settlement-flow">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div class="avatar-badge" style="background:#ef4444; width:36px; height:36px; font-size:0.85rem;">
                ${escapeHTML(s.fromAvatar || s.fromUserName.charAt(0))}
              </div>
              <div>
                <strong style="color:var(--danger);">${escapeHTML(s.fromUserName)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Debtor</div>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.85rem;">
              <span>pays</span>
              <span style="font-size:1.1rem; color:var(--primary); font-weight:800;">&rarr;</span>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem;">
              <div class="avatar-badge" style="background:#10b981; width:36px; height:36px; font-size:0.85rem;">
                ${escapeHTML(s.toAvatar || s.toUserName.charAt(0))}
              </div>
              <div>
                <strong style="color:var(--success);">${escapeHTML(s.toUserName)}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">Creditor</div>
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:1rem;">
            <span style="font-size:1.3rem; font-weight:800; font-family:var(--font-mono);">${state.currency}${s.amount.toFixed(2)}</span>
            <button class="btn btn-primary btn-sm" onclick="recordDirectSettlement(${groupId}, ${s.fromUserId}, ${s.toUserId}, ${s.amount}, '${escapeHTML(s.fromUserName)} paid ${escapeHTML(s.toUserName)}')">
              ✓ Settle Now
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

window.recordDirectSettlement = async function(groupId, payerId, payeeId, amount, note) {
  const allUsers = localApi.getUsers();
  const payer = allUsers.find(u => u.id === payerId) || { id: payerId, name: 'Payer' };
  const payee = allUsers.find(u => u.id === payeeId) || { id: payeeId, name: 'Payee' };

  const settlement = {
    id: Date.now(),
    groupId,
    payer,
    payee,
    amount,
    note,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        payerId,
        payeeId,
        amount,
        note
      })
    });

    if (res.ok) {
      showToast(`Settlement payment of ${state.currency}${amount.toFixed(2)} recorded!`, 'success');
    } else {
      localApi.saveSettlement(settlement);
      showToast(`Settlement payment of ${state.currency}${amount.toFixed(2)} recorded!`, 'success');
    }
  } catch (err) {
    localApi.saveSettlement(settlement);
    showToast(`Settlement payment recorded!`, 'success');
  }

  loadGroupAnalysis(groupId);
  loadDashboard();
};

// ---------------------------------------------------------------------------
// 11. History Module & CSV Export
// ---------------------------------------------------------------------------
async function loadHistory() {
  let expenses = [];
  let settlements = [];

  try {
    const [expRes, setRes] = await Promise.all([fetch('/api/expenses'), fetch('/api/settlements')]);
    if (expRes.ok) expenses = await expRes.json();
    if (setRes.ok) settlements = await setRes.json();
  } catch (err) {
    // fallback
  }

  if (expenses.length === 0) expenses = localApi.getExpenses();
  if (settlements.length === 0) settlements = localApi.getSettlements();

  const expTable = document.getElementById('historyExpensesTableBody');
  if (expTable) {
    if (expenses.length === 0) {
      expTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No expenses found.</td></tr>';
    } else {
      expTable.innerHTML = expenses.map(e => `
        <tr>
          <td>${new Date(e.createdAt).toLocaleDateString()}</td>
          <td><strong>${escapeHTML(e.description)}</strong></td>
          <td>${escapeHTML(e.group ? e.group.name : '-')}</td>
          <td>${escapeHTML(e.paidBy ? e.paidBy.name : '-')}</td>
          <td style="font-weight:700; font-family:var(--font-mono);">${state.currency}${e.amount.toFixed(2)}</td>
        </tr>
      `).join('');
    }
  }

  const setTable = document.getElementById('historySettlementsTableBody');
  if (setTable) {
    if (settlements.length === 0) {
      setTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No settlements recorded yet.</td></tr>';
    } else {
      setTable.innerHTML = settlements.map(s => `
        <tr>
          <td>${new Date(s.createdAt).toLocaleDateString()}</td>
          <td><span style="color:var(--danger); font-weight:600;">${escapeHTML(s.payer ? s.payer.name : 'Unknown')}</span></td>
          <td><span style="color:var(--success); font-weight:600;">${escapeHTML(s.payee ? s.payee.name : 'Unknown')}</span></td>
          <td style="font-weight:700; font-family:var(--font-mono);">${state.currency}${s.amount.toFixed(2)}</td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${escapeHTML(s.note || 'Settlement payment')}</td>
        </tr>
      `).join('');
    }
  }
}

window.exportExpensesCSV = async function() {
  let expenses = [];
  try {
    const res = await fetch('/api/expenses');
    if (res.ok) expenses = await res.json();
  } catch (err) {
    // fallback
  }

  if (expenses.length === 0) expenses = localApi.getExpenses();

  if (expenses.length === 0) {
    showToast('No expenses to export', 'info');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,Date,Description,Group,Paid By,Category,Split Type,Amount\n';
  expenses.forEach(e => {
    const date = new Date(e.createdAt).toISOString().split('T')[0];
    const desc = `"${e.description.replace(/"/g, '""')}"`;
    const group = `"${(e.group ? e.group.name : '').replace(/"/g, '""')}"`;
    const paidBy = `"${(e.paidBy ? e.paidBy.name : '').replace(/"/g, '""')}"`;
    const cat = `"${(e.category || 'General').replace(/"/g, '""')}"`;
    const split = e.splitType || 'EQUAL';
    const amt = e.amount.toFixed(2);
    csvContent += `${date},${desc},${group},${paidBy},${cat},${split},${amt}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Expenses CSV exported successfully!', 'success');
};

// ---------------------------------------------------------------------------
// 12. Utilities & Notifications
// ---------------------------------------------------------------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}
