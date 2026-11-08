
(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'expense_tracker_data';

  const SAMPLE_TRANSACTIONS = [
    {
      id: 'tx-1',
      title: 'Monthly Salary',
      amount: 65000.00,
      type: 'income',
      category: 'Salary',
      date: getFormattedDateOffset(0) // Today
    },
    {
      id: 'tx-2',
      title: 'Apartment Rent',
      amount: 18000.00,
      type: 'expense',
      category: 'Housing & Utilities',
      date: getFormattedDateOffset(-2)
    },
    {
      id: 'tx-3',
      title: 'Supermarket Groceries',
      amount: 4500.00,
      type: 'expense',
      category: 'Food & Dining',
      date: getFormattedDateOffset(-4)
    },
    {
      id: 'tx-4',
      title: 'Freelance Design Project',
      amount: 12000.00,
      type: 'income',
      category: 'Other',
      date: getFormattedDateOffset(-6)
    },
    {
      id: 'tx-5',
      title: 'Transport & Rickshaw Fare',
      amount: 1500.00,
      type: 'expense',
      category: 'Transport',
      date: getFormattedDateOffset(-8)
    }
  ];

  // --- Application State ---
  let transactions = [];
  let currentFilter = 'all'; 
  let searchQuery = '';
  let pendingDeleteId = null;

  // --- DOM Elements ---
  const elements = {
    // Form elements
    form: document.getElementById('transactionForm'),
    formTitle: document.getElementById('formTitle'),
    formBadge: document.getElementById('formBadge'),
    editTransactionId: document.getElementById('editTransactionId'),
    titleInput: document.getElementById('title'),
    amountInput: document.getElementById('amount'),
    typeInput: document.getElementById('type'),
    categoryInput: document.getElementById('category'),
    dateInput: document.getElementById('date'),
    submitBtn: document.getElementById('submitBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),

    // Error messages
    titleError: document.getElementById('titleError'),
    amountError: document.getElementById('amountError'),
    typeError: document.getElementById('typeError'),
    categoryError: document.getElementById('categoryError'),
    dateError: document.getElementById('dateError'),

    // Dashboard values
    totalBalance: document.getElementById('totalBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    monthlyExpense: document.getElementById('monthlyExpense'),
    currentMonthLabel: document.getElementById('currentMonthLabel'),

    // List & Controls
    transactionList: document.getElementById('transactionList'),
    transactionTable: document.getElementById('transactionTable'),
    transactionCountBadge: document.getElementById('transactionCountBadge'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateSubtitle: document.getElementById('emptyStateSubtitle'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterButtons: document.querySelectorAll('.filter-btn'),

    // Modals & Notifications
    toast: document.getElementById('toast'),
    deleteModal: document.getElementById('deleteModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),

    // Header actions
    seedDataBtn: document.getElementById('seedDataBtn'),
    clearAllBtn: document.getElementById('clearAllBtn')
  };

  let toastTimeout = null;

  // --- Helper Functions ---
  function getFormattedDateOffset(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatCurrency(amount) {
    const num = Math.abs(Number(amount) || 0);
    return '৳' + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDateDisplay(dateString) {
    if (!dateString) return '-';
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateString;
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- LocalStorage Handling ---
  function loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        transactions = Array.isArray(parsed) ? parsed : [];
      } else {
        transactions = [];
      }
    } catch (err) {
      console.error('Error loading transactions from localStorage:', err);
      transactions = [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.error('Error saving transactions to localStorage:', err);
      showToast('Error saving data to local storage', 'danger');
    }
  }

  // --- Toast Notification ---
  function showToast(message, type = 'success') {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    elements.toast.textContent = message;
    elements.toast.className = `toast toast-${type} show`;

    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3200);
  }

  // --- Validation ---
  function clearErrors() {
    elements.titleError.textContent = '';
    elements.amountError.textContent = '';
    elements.typeError.textContent = '';
    elements.categoryError.textContent = '';
    elements.dateError.textContent = '';

    elements.titleInput.classList.remove('input-error');
    elements.amountInput.classList.remove('input-error');
    elements.typeInput.classList.remove('input-error');
    elements.categoryInput.classList.remove('input-error');
    elements.dateInput.classList.remove('input-error');
  }

  function validateForm() {
    clearErrors();
    let isValid = true;

    // Validate Title
    const titleVal = elements.titleInput.value.trim();
    if (!titleVal) {
      elements.titleError.textContent = 'Please enter a transaction title.';
      elements.titleInput.classList.add('input-error');
      isValid = false;
    } else if (titleVal.length > 80) {
      elements.titleError.textContent = 'Title cannot exceed 80 characters.';
      elements.titleInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Amount
    const amountVal = parseFloat(elements.amountInput.value);
    if (isNaN(amountVal) || elements.amountInput.value.trim() === '') {
      elements.amountError.textContent = 'Please enter a valid amount.';
      elements.amountInput.classList.add('input-error');
      isValid = false;
    } else if (amountVal <= 0) {
      elements.amountError.textContent = 'Amount must be greater than 0.';
      elements.amountInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Type
    const typeVal = elements.typeInput.value;
    if (typeVal !== 'income' && typeVal !== 'expense') {
      elements.typeError.textContent = 'Please select a valid transaction type.';
      elements.typeInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Category
    const categoryVal = elements.categoryInput.value;
    if (!categoryVal) {
      elements.categoryError.textContent = 'Please select a category.';
      elements.categoryInput.classList.add('input-error');
      isValid = false;
    }

    // Validate Date
    const dateVal = elements.dateInput.value;
    if (!dateVal) {
      elements.dateError.textContent = 'Please select a valid date.';
      elements.dateInput.classList.add('input-error');
      isValid = false;
    }

    return isValid;
  }

  // --- Form Reset & Edit Mode ---
  function resetForm() {
    elements.form.reset();
    elements.editTransactionId.value = '';
    elements.dateInput.value = getFormattedDateOffset(0);
    elements.formTitle.textContent = 'Add Transaction';
    elements.submitBtn.textContent = 'Add Transaction';
    elements.cancelEditBtn.style.display = 'none';
    elements.formBadge.style.display = 'none';
    clearErrors();
  }

  function setEditMode(transaction) {
    elements.editTransactionId.value = transaction.id;
    elements.titleInput.value = transaction.title;
    elements.amountInput.value = transaction.amount;
    elements.typeInput.value = transaction.type;
    elements.categoryInput.value = transaction.category;
    elements.dateInput.value = transaction.date;

    elements.formTitle.textContent = 'Edit Transaction';
    elements.submitBtn.textContent = 'Update Transaction';
    elements.cancelEditBtn.style.display = 'inline-block';
    elements.formBadge.style.display = 'inline-block';

    clearErrors();
    elements.form.scrollIntoView({ behavior: 'smooth' });
    elements.titleInput.focus();
  }

  // --- Dashboard Calculations ---
  function updateDashboard() {
    let incomeTotal = 0;
    let expenseTotal = 0;
    let currentMonthExpense = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Format Month Label, e.g. "Nov Spending"
    const monthName = now.toLocaleString('en-US', { month: 'short' });
    elements.currentMonthLabel.textContent = `${monthName} Expenses`;

    transactions.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        incomeTotal += amount;
      } else if (tx.type === 'expense') {
        expenseTotal += amount;

        // Check if transaction is in the current calendar month
        if (tx.date) {
          const parts = tx.date.split('-');
          if (parts.length === 3) {
            const txYear = parseInt(parts[0], 10);
            const txMonth = parseInt(parts[1], 10) - 1;
            if (txYear === currentYear && txMonth === currentMonth) {
              currentMonthExpense += amount;
            }
          }
        }
      }
    });

    const balance = incomeTotal - expenseTotal;

    // Render Dashboard Values
    elements.totalIncome.textContent = formatCurrency(incomeTotal);
    elements.totalExpense.textContent = formatCurrency(expenseTotal);
    elements.monthlyExpense.textContent = formatCurrency(currentMonthExpense);

    if (balance < 0) {
      elements.totalBalance.textContent = `-${formatCurrency(Math.abs(balance))}`;
      elements.totalBalance.style.color = 'var(--danger)';
    } else {
      elements.totalBalance.textContent = formatCurrency(balance);
      elements.totalBalance.style.color = 'var(--text-main)';
    }
  }

  // --- Rendering Transactions List ---
  function renderTransactions() {
    // 1. Filter by Type
    let filtered = transactions.filter(tx => {
      if (currentFilter === 'all') return true;
      return tx.type === currentFilter;
    });

    // 2. Filter by Search Query (Title)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(tx => tx.title.toLowerCase().includes(q));
    }

    // 3. Sort by Date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update Transaction Count Badge
    const totalCount = transactions.length;
    elements.transactionCountBadge.textContent = `${totalCount} total`;

    // Clear previous rows
    elements.transactionList.innerHTML = '';

    // Handle Empty State
    if (filtered.length === 0) {
      elements.transactionTable.style.display = 'none';
      elements.emptyState.style.display = 'block';

      if (transactions.length === 0) {
        elements.emptyStateTitle.textContent = 'No transactions recorded yet';
        elements.emptyStateSubtitle.textContent = 'Use the form to record your first income or expense, or click "Load Sample Data" above.';
      } else {
        elements.emptyStateTitle.textContent = 'No matching transactions';
        elements.emptyStateSubtitle.textContent = 'Try adjusting your search query or filter selection.';
      }
      return;
    }

    // Show Table
    elements.transactionTable.style.display = 'table';
    elements.emptyState.style.display = 'none';

    // Populate rows
    filtered.forEach(tx => {
      const row = document.createElement('tr');
      row.dataset.id = tx.id;

      const isIncome = tx.type === 'income';
      const typeBadgeClass = isIncome ? 'badge-income' : 'badge-expense';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';
      const amountSign = isIncome ? '+' : '-';

      row.innerHTML = `
        <td class="tx-date">${formatDateDisplay(tx.date)}</td>
        <td class="tx-title">${escapeHTML(tx.title)}</td>
        <td><span class="badge badge-category">${escapeHTML(tx.category)}</span></td>
        <td><span class="badge ${typeBadgeClass}">${isIncome ? 'Income' : 'Expense'}</span></td>
        <td class="text-right tx-amount ${amountClass}">${amountSign}${formatCurrency(tx.amount)}</td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-icon edit-btn" title="Edit transaction" aria-label="Edit ${escapeHTML(tx.title)}">
              ✏️
            </button>
            <button class="btn-icon delete-btn" title="Delete transaction" aria-label="Delete ${escapeHTML(tx.title)}">
              🗑️
            </button>
          </div>
        </td>
      `;

      // Event listeners for action buttons
      row.querySelector('.edit-btn').addEventListener('click', () => {
        setEditMode(tx);
      });

      row.querySelector('.delete-btn').addEventListener('click', () => {
        openDeleteModal(tx.id, tx.title);
      });

      elements.transactionList.appendChild(row);
    });
  }

  // --- Modal Logic ---
  function openDeleteModal(id, title) {
    pendingDeleteId = id;
    if (id === 'CLEAR_ALL') {
      elements.modalTitle.textContent = 'Clear All Transactions?';
      elements.modalDescription.textContent = 'This will permanently remove all income and expense records. Are you sure you want to proceed?';
      elements.confirmDeleteBtn.textContent = 'Yes, Clear All';
      elements.confirmDeleteBtn.className = 'btn btn-danger';
    } else if (id === 'LOAD_SAMPLE') {
      elements.modalTitle.textContent = 'Load Sample Data?';
      elements.modalDescription.textContent = 'Loading sample data will replace your existing transactions. Are you sure you want to continue?';
      elements.confirmDeleteBtn.textContent = 'Yes, Load Data';
      elements.confirmDeleteBtn.className = 'btn btn-primary';
    } else {
      elements.modalTitle.textContent = 'Delete Transaction?';
      elements.modalDescription.textContent = `Are you sure you want to delete "${title}"? This action cannot be undone.`;
      elements.confirmDeleteBtn.textContent = 'Yes, Delete';
      elements.confirmDeleteBtn.className = 'btn btn-danger';
    }
    elements.deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    elements.deleteModal.style.display = 'none';
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) return;

    if (pendingDeleteId === 'CLEAR_ALL') {
      transactions = [];
      saveTransactions();
      updateDashboard();
      renderTransactions();
      resetForm();
      showToast('All transactions cleared.', 'info');
      closeDeleteModal();
      return;
    }

    if (pendingDeleteId === 'LOAD_SAMPLE') {
      loadSampleData();
      closeDeleteModal();
      return;
    }

    const index = transactions.findIndex(t => t.id === pendingDeleteId);
    if (index !== -1) {
      // If the currently edited transaction is deleted, reset the form
      if (elements.editTransactionId.value === pendingDeleteId) {
        resetForm();
      }

      transactions.splice(index, 1);
      saveTransactions();
      updateDashboard();
      renderTransactions();
      showToast('Transaction deleted successfully.', 'danger');
    }

    closeDeleteModal();
  }

  // --- Event Handlers ---

  // Form Submit (Add / Edit)
  elements.form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const editId = elements.editTransactionId.value;
    const title = elements.titleInput.value.trim();
    const amount = parseFloat(elements.amountInput.value);
    const type = elements.typeInput.value;
    const category = elements.categoryInput.value;
    const date = elements.dateInput.value;

    if (editId) {
      // Updating existing transaction
      const index = transactions.findIndex(t => t.id === editId);
      if (index !== -1) {
        transactions[index] = {
          ...transactions[index],
          title,
          amount,
          type,
          category,
          date
        };
        saveTransactions();
        updateDashboard();
        renderTransactions();
        showToast('Transaction updated successfully!', 'success');
      }
    } else {
      // Adding new transaction
      const newTransaction = {
        id: 'tx-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        title,
        amount,
        type,
        category,
        date
      };
      transactions.unshift(newTransaction);
      saveTransactions();
      updateDashboard();
      renderTransactions();
      showToast('Transaction added successfully!', 'success');
    }

    resetForm();
  });

  // Cancel Edit
  elements.cancelEditBtn.addEventListener('click', resetForm);

  // Filter Buttons
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTransactions();
    });
  });

  // Search Input
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    elements.clearSearchBtn.style.display = searchQuery ? 'inline-block' : 'none';
    renderTransactions();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    renderTransactions();
    elements.searchInput.focus();
  });

  // Delete Modal Events
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Close modal when clicking on backdrop
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });

  // Close modal on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.deleteModal.style.display === 'flex') {
      closeDeleteModal();
    }
  });

  // Clear All button
  elements.clearAllBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
      showToast('No transactions to clear.', 'info');
      return;
    }
    openDeleteModal('CLEAR_ALL', 'All Transactions');
  });

  // Helper to load sample data
  function loadSampleData() {
    transactions = JSON.parse(JSON.stringify(SAMPLE_TRANSACTIONS));
    saveTransactions();
    updateDashboard();
    renderTransactions();
    resetForm();
    showToast('Sample transactions loaded!', 'info');
  }

  // Load Sample Data button
  elements.seedDataBtn.addEventListener('click', () => {
    if (transactions.length > 0) {
      openDeleteModal('LOAD_SAMPLE', 'Sample Data');
    } else {
      loadSampleData();
    }
  });

  // Clear validation styling dynamically on input
  [elements.titleInput, elements.amountInput, elements.typeInput, elements.categoryInput, elements.dateInput].forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      const errElem = document.getElementById(input.id + 'Error');
      if (errElem) errElem.textContent = '';
    });
  });

  // --- Initial Setup ---
  function init() {
    loadTransactions();
    elements.dateInput.value = getFormattedDateOffset(0);
    updateDashboard();
    renderTransactions();
  }

  init();
})();

