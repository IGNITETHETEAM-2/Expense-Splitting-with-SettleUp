/**
 * Expense Splitter - Client Application Logic
 * Integrates with Spring Boot REST API with full precision splitting
 */

const state = {
  users: [],
  groups: [],
  selectedGroupId: null,
  activeTab: 'dashboard',
  selectedGroupMembersForCreate: new Set(),
  currency: '₹',
  theme: localStorage.getItem('theme') || 'light',
  currentSplitType: 'EQUAL',
  expenseParticipants: new Set()
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initEventListeners();
  loadAllData();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
  }
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

  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'groups') loadGroups();
  if (tabId === 'people') loadPeople();
  if (tabId === 'expenses') loadExpenseFormAndList();
  if (tabId === 'settleup') loadSettleUpView();
  if (tabId === 'history') loadHistory();
}

// Event Listeners
function initEventListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Currency Selector
  const currencySelect = document.getElementById('currencySelector');
  if (currencySelect) {
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

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email })
        });
        if (res.ok) {
          showToast(`Member "${name}" added successfully!`, 'success');
          document.getElementById('personNameInput').value = '';
          document.getElementById('personEmailInput').value = '';
          await loadPeople();
          await loadGroups();
        } else {
          showToast('Failed to add member', 'error');
        }
      } catch (err) {
        showToast('Error connecting to backend API', 'error');
      }
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
          document.getElementById('groupNameInput').value = '';
          document.getElementById('groupDescInput').value = '';
          state.selectedGroupMembersForCreate.clear();
          await loadGroups();
          renderGroupMemberChips();
          switchTab('groups');
        } else {
          showToast('Failed to create group', 'error');
        }
      } catch (err) {
        showToast('Network error while creating group', 'error');
      }
    });
  }

  // Split Type Buttons
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

// Data Fetching
async function loadAllData() {
  await Promise.all([loadPeople(), loadGroups(), loadDashboard()]);
}

function refreshCurrentView() {
  if (state.activeTab === 'dashboard') loadDashboard();
  if (state.activeTab === 'settleup') loadSettleUpView();
  if (state.activeTab === 'groups') loadGroups();
}

// 1. Dashboard Module
async function loadDashboard() {
  try {
    const res = await fetch('/api/analytics/dashboard');
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById('kpiTotalExpenses').textContent = `${state.currency}${stats.totalExpenses.toFixed(2)}`;
    document.getElementById('kpiTotalGroups').textContent = stats.totalGroups;
    document.getElementById('kpiTotalUsers').textContent = stats.totalUsers;
    document.getElementById('kpiTotalSettled').textContent = `${state.currency}${stats.totalSettledAmount.toFixed(2)}`;

    renderCategoryDistribution(stats.categorySpending);
    loadRecentExpenses();
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

function renderCategoryDistribution(categories) {
  const container = document.getElementById('categoryBreakdownContainer');
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
  try {
    const res = await fetch('/api/expenses');
    if (!res.ok) return;
    const expenses = await res.json();
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
  } catch (err) {
    console.error('Error loading recent expenses:', err);
  }
}

// 2. People Module
async function loadPeople() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) return;
    state.users = await res.json();

    const peopleList = document.getElementById('registeredPeopleList');
    if (peopleList) {
      peopleList.innerHTML = state.users.map(u => `
        <div class="balance-card">
          <div class="balance-user-info">
            <div class="avatar-badge">${escapeHTML(u.avatar || u.name.charAt(0).toUpperCase())}</div>
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
  } catch (err) {
    console.error('Error loading people:', err);
  }
}

// Unlimited Team Member Chips for Group Creation
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
        <span class="avatar-mini">${escapeHTML(u.avatar || u.name.charAt(0))}</span>
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

// 3. Groups Module
async function loadGroups() {
  try {
    const res = await fetch('/api/groups');
    if (!res.ok) return;
    state.groups = await res.json();

    // Populate Group Dropdowns
    const expGroupSelect = document.getElementById('expenseGroupSelect');
    const analysisGroupSelect = document.getElementById('analysisGroupSelect');

    const groupOptions = state.groups.map(g => `<option value="${g.id}">${escapeHTML(g.name)} (${g.members.length} members)</option>`).join('');

    if (expGroupSelect) {
      expGroupSelect.innerHTML = '<option value="" disabled selected>-- Select a Group --</option>' + groupOptions;
      if (state.selectedGroupId) expGroupSelect.value = state.selectedGroupId;
    }
    if (analysisGroupSelect) {
      analysisGroupSelect.innerHTML = '<option value="" disabled selected>-- Select a Group for Analysis --</option>' + groupOptions;
      if (state.selectedGroupId) analysisGroupSelect.value = state.selectedGroupId;
    }

    // Render Groups List
    const groupsList = document.getElementById('activeGroupsList');
    if (groupsList) {
      if (state.groups.length === 0) {
        groupsList.innerHTML = '<p style="color:var(--text-muted);">No active groups. Create your first group!</p>';
        return;
      }

      groupsList.innerHTML = state.groups.map(g => `
        <div class="card-section" style="margin-bottom:1rem; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
            <div>
              <h3 style="font-size:1.15rem; font-weight:700;">${escapeHTML(g.name)}</h3>
              <p style="font-size:0.85rem; color:var(--text-muted);">${escapeHTML(g.description || 'No description')}</p>
            </div>
            <span class="category-pill">${escapeHTML(g.category || 'General')}</span>
          </div>
          <div style="font-size:0.85rem; margin-bottom:0.75rem;">
            <strong>Members (${g.members.length}):</strong>
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.4rem;">
              ${g.members.map(m => `<span class="member-chip"><span class="avatar-mini">${escapeHTML(m.avatar || m.name.charAt(0))}</span>${escapeHTML(m.name)}</span>`).join('')}
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="selectGroupForExpense(${g.id})">Add Expense</button>
            <button class="btn btn-primary btn-sm" onclick="selectGroupForAnalysis(${g.id})">View SettleUp Analysis</button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading groups:', err);
  }
}

window.selectGroupForExpense = function(groupId) {
  state.selectedGroupId = groupId;
  switchTab('expenses');
  const sel = document.getElementById('expenseGroupSelect');
  if (sel) {
    sel.value = groupId;
    updateExpenseFormForSelectedGroup();
  }
};

window.selectGroupForAnalysis = function(groupId) {
  state.selectedGroupId = groupId;
  switchTab('settleup');
  const sel = document.getElementById('analysisGroupSelect');
  if (sel) {
    sel.value = groupId;
    loadGroupAnalysis(groupId);
  }
};

// 4. Expenses & Splitting Module
function loadExpenseFormAndList() {
  if (state.selectedGroupId) {
    updateExpenseFormForSelectedGroup();
  }
  loadRecentExpenses();
}

function updateExpenseFormForSelectedGroup() {
  const group = state.groups.find(g => g.id === state.selectedGroupId);
  const payerSelect = document.getElementById('expensePayerSelect');
  if (!group || !payerSelect) return;

  payerSelect.innerHTML = group.members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('');

  // Default all group members as participants
  state.expenseParticipants = new Set(group.members.map(m => m.id));
  renderSplitSharesInputs();
}

function renderSplitSharesInputs() {
  const container = document.getElementById('splitSharesInputsContainer');
  const summaryBar = document.getElementById('splitSummaryBar');
  if (!container || !summaryBar) return;

  const group = state.groups.find(g => g.id === state.selectedGroupId);
  if (!group) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Select a group first to configure precise split shares.</p>';
    summaryBar.style.display = 'none';
    return;
  }

  summaryBar.style.display = 'flex';
  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  const participants = group.members.filter(m => state.expenseParticipants.has(m.id));

  if (participants.length === 0) {
    container.innerHTML = '<p style="color:var(--danger); font-size:0.85rem;">Please select at least one participant.</p>';
    summaryBar.className = 'split-summary-bar invalid';
    summaryBar.textContent = 'No participants selected';
    return;
  }

  let html = '';

  if (state.currentSplitType === 'EQUAL') {
    const baseShare = participants.length > 0 ? (totalAmount / participants.length) : 0;
    summaryBar.className = 'split-summary-bar valid';
    summaryBar.innerHTML = `<span>Equal Split (${participants.length} members)</span><span>Each owes: <strong>${state.currency}${baseShare.toFixed(2)}</strong></span>`;

    html = participants.map(m => `
      <div class="member-share-row">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <input type="checkbox" checked onchange="toggleExpenseParticipant(${m.id})" id="part_${m.id}">
          <label for="part_${m.id}" style="font-weight:600; cursor:pointer;">${escapeHTML(m.name)}</label>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted);">Equal Share</div>
        <div style="font-weight:700; text-align:right; font-family:var(--font-mono);">${state.currency}${baseShare.toFixed(2)}</div>
      </div>
    `).join('');
  } 
  else if (state.currentSplitType === 'EXACT') {
    html = participants.map(m => `
      <div class="member-share-row">
        <label style="font-weight:600;">${escapeHTML(m.name)}</label>
        <div style="font-size:0.8rem; color:var(--text-muted);">Exact Amount (${state.currency})</div>
        <input type="number" step="0.01" min="0" class="form-group exact-share-input" 
               data-userid="${m.id}" placeholder="0.00" oninput="validateExactSplit()" style="padding:0.4rem 0.6rem; margin:0; text-align:right;">
      </div>
    `).join('');
    validateExactSplit();
  }
  else if (state.currentSplitType === 'PERCENTAGE') {
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
  }
  else if (state.currentSplitType === 'SHARES') {
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
      showToast('At least one participant required', 'warning');
    }
  } else {
    state.expenseParticipants.add(userId);
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

  if (isMatch) {
    summaryBar.className = 'split-summary-bar valid';
    summaryBar.innerHTML = `<span>Exact Match! Total: ${state.currency}${totalAmount.toFixed(2)}</span><span>Remaining: 0.00</span>`;
  } else {
    summaryBar.className = 'split-summary-bar invalid';
    summaryBar.innerHTML = `<span>Total Needed: ${state.currency}${totalAmount.toFixed(2)}</span><span>${diff > 0 ? `Under by ${state.currency}${diff.toFixed(2)}` : `Over by ${state.currency}${Math.abs(diff).toFixed(2)}`}</span>`;
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

  if (isMatch) {
    summaryBar.className = 'split-summary-bar valid';
    summaryBar.innerHTML = `<span>Percentages sum to 100%</span><span>✓ Valid</span>`;
  } else {
    summaryBar.className = 'split-summary-bar invalid';
    summaryBar.innerHTML = `<span>Current Total: ${totalPct.toFixed(1)}%</span><span>${diff > 0 ? `Need ${diff.toFixed(1)}% more` : `Exceeds by ${Math.abs(diff).toFixed(1)}%`}</span>`;
  }
};

window.validateSharesSplit = function() {
  const summaryBar = document.getElementById('splitSummaryBar');
  const totalAmount = parseFloat(document.getElementById('expenseAmountInput').value) || 0;
  let totalShares = 0;

  document.querySelectorAll('.shares-share-input').forEach(input => {
    totalShares += parseFloat(input.value) || 1;
  });

  if (totalShares <= 0) totalShares = 1;

  document.querySelectorAll('.shares-share-input').forEach(input => {
    const shares = parseFloat(input.value) || 1;
    const uId = input.dataset.userid;
    const calcEl = document.getElementById(`sharesCalc_${uId}`);
    if (calcEl) {
      calcEl.textContent = `${state.currency}${((shares / totalShares) * totalAmount).toFixed(2)}`;
    }
  });

  summaryBar.className = 'split-summary-bar valid';
  summaryBar.innerHTML = `<span>Total Shares: ${totalShares}</span><span>Ratio Split Active</span>`;
};

async function handleExpenseSubmit() {
  const groupId = state.selectedGroupId;
  const description = document.getElementById('expenseDescInput').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmountInput').value);
  const category = document.getElementById('expenseCategorySelect').value;
  const paidById = Number(document.getElementById('expensePayerSelect').value);
  const splitType = state.currentSplitType;

  if (!groupId || !description || isNaN(amount) || amount <= 0 || !paidById) {
    showToast('Please fill all required fields properly', 'error');
    return;
  }

  // Construct precise shares payload
  const shares = [];
  if (splitType === 'EQUAL') {
    state.expenseParticipants.forEach(userId => {
      shares.push({ userId, shareValue: 0.0 });
    });
  } else if (splitType === 'EXACT') {
    let sum = 0;
    document.querySelectorAll('.exact-share-input').forEach(input => {
      const val = parseFloat(input.value) || 0;
      sum += val;
      shares.push({ userId: Number(input.dataset.userid), shareValue: val });
    });
    if (Math.abs(sum - amount) > 0.05) {
      showToast(`Exact shares sum (${state.currency}${sum.toFixed(2)}) must equal total (${state.currency}${amount.toFixed(2)})`, 'error');
      return;
    }
  } else if (splitType === 'PERCENTAGE') {
    let sumPct = 0;
    document.querySelectorAll('.percentage-share-input').forEach(input => {
      const val = parseFloat(input.value) || 0;
      sumPct += val;
      shares.push({ userId: Number(input.dataset.userid), shareValue: val });
    });
    if (Math.abs(sumPct - 100) > 0.1) {
      showToast(`Percentages must sum to 100%. Currently: ${sumPct.toFixed(1)}%`, 'error');
      return;
    }
  } else if (splitType === 'SHARES') {
    document.querySelectorAll('.shares-share-input').forEach(input => {
      const val = parseFloat(input.value) || 1;
      shares.push({ userId: Number(input.dataset.userid), shareValue: val });
    });
  }

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        description,
        amount,
        category,
        paidById,
        splitType,
        shares
      })
    });

    if (res.ok) {
      showToast(`Expense "${description}" added and split precisely!`, 'success');
      document.getElementById('expenseDescInput').value = '';
      document.getElementById('expenseAmountInput').value = '';
      renderSplitSharesInputs();
      await loadDashboard();
      switchTab('settleup');
      loadGroupAnalysis(groupId);
    } else {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.message || 'Failed to add expense', 'error');
    }
  } catch (err) {
    showToast('Network error while saving expense', 'error');
  }
}

// 5. SettleUp & Balance Analysis Module
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
  try {
    const res = await fetch(`/api/groups/${groupId}/analysis`);
    if (!res.ok) return;
    const analysis = await res.json();

    document.getElementById('analysisTotalExpense').textContent = `${state.currency}${analysis.totalExpenses.toFixed(2)}`;
    document.getElementById('analysisMembersCount').textContent = analysis.membersCount;
    document.getElementById('analysisExpensesCount').textContent = analysis.expensesCount;

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
            <strong style="color:var(--success);">All settled up!</strong>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">No outstanding debts among group members.</p>
          </div>
        `;
      } else {
        suggestionsBox.innerHTML = analysis.suggestedSettlements.map((s, idx) => `
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
              <div class="settlement-arrow">➔</div>
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
  } catch (err) {
    console.error('Error loading group analysis:', err);
  }
}

window.recordDirectSettlement = async function(groupId, payerId, payeeId, amount, note) {
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
      loadGroupAnalysis(groupId);
      loadDashboard();
    } else {
      showToast('Failed to record settlement', 'error');
    }
  } catch (err) {
    showToast('Network error recording settlement', 'error');
  }
};

// 6. History Module & CSV Export
async function loadHistory() {
  try {
    const [expRes, setRes] = await Promise.all([fetch('/api/expenses'), fetch('/api/settlements')]);
    const expenses = expRes.ok ? await expRes.json() : [];
    const settlements = setRes.ok ? await setRes.json() : [];

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
            <td>${new Date(s.settledAt).toLocaleDateString()}</td>
            <td><strong>${escapeHTML(s.payer.name)}</strong></td>
            <td><strong>${escapeHTML(s.payee.name)}</strong></td>
            <td><span class="category-pill" style="background:var(--success-bg); color:var(--success); font-weight:700;">${state.currency}${s.amount.toFixed(2)}</span></td>
            <td>${escapeHTML(s.note || 'Settlement payment')}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading history:', err);
  }
}

// CSV Export
window.exportExpensesCSV = async function() {
  try {
    const res = await fetch('/api/expenses');
    if (!res.ok) return;
    const expenses = await res.json();
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
      const split = e.splitType;
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
  } catch (err) {
    showToast('Failed to export CSV', 'error');
  }
};

// Toast Notifications
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

// Utility
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}
