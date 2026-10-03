// =============================================================
// StorageModule
// Handles all reading from and writing to localStorage.
// Storage key: "expense_visualizer_transactions"
// Requirements: 6.3, 6.4, 6.5
// =============================================================
const StorageModule = (function () {
  const KEY = 'expense_visualizer_transactions';

  /**
   * load() → Transaction[]
   * Reads the storage key, JSON-parses it, and returns the array.
   * Returns [] if the key is missing, the value is invalid JSON,
   * or the parsed result is not an array. Never throws.
   */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      // getItem returns null when the key does not exist
      if (raw === null) {
        return [];
      }
      const parsed = JSON.parse(raw);
      // Guard against valid JSON that is not an array (object, number, null, etc.)
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch (err) {
      // Covers SyntaxError from JSON.parse and any unexpected errors
      console.error('StorageModule.load() failed:', err);
      return [];
    }
  }

  /**
   * save(transactions) → void
   * Serializes the array with JSON.stringify and writes it to the storage key.
   * Wraps the write in a try/catch so a storage-quota error (or any other
   * DOMException) is logged but does not crash the app.
   */
  function save(transactions) {
    try {
      localStorage.setItem(KEY, JSON.stringify(transactions));
    } catch (err) {
      console.error('StorageModule.save() failed:', err);
    }
  }

  /**
   * addTransaction(tx) → Transaction[]
   * Stamps tx with a generated id and createdAt timestamp, inserts it at
   * the front of the array (newest-first), persists it, returns the updated array.
   * Requirements: 2.1, 3.2, 6.1, 6.2
   */
  function addTransaction(tx) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    const newTx = Object.assign({}, tx, {
      id: id,
      createdAt: Date.now(),
    });

    const transactions = load();
    transactions.push(newTx); // newest-first: insert at the front
    save(transactions);
    return transactions;
  }

  /**
   * deleteTransaction(id) → Transaction[]
   * Filters out the entry whose id matches, persists the result,
   * returns the updated array. If no entry matches, the array is
   * returned unchanged and no error is thrown.
   */
  function deleteTransaction(id) {
    const transactions = load();
    const updated = transactions.filter(function (tx) {
      return tx.id !== id;
    });
    save(updated);
    return updated;
  }

  return { load, save, addTransaction, deleteTransaction };
})();

// =============================================================
// Validator
// Validates form data before creating a transaction.
// Requirements: 1.3, 1.4, 1.5, 1.6
// =============================================================
const Validator = (function () {
  const KNOWN_CATEGORIES = ['Food', 'Transport', 'Fun'];

  /**
   * validate(formData) → { valid: boolean, errors: object }
   * Checks name, amount, and category against their rules.
   * Returns valid: true only when all three fields pass.
   *
   * Rules:
   *   name     – trimmed length must be 1–100 characters
   *   amount   – must be a finite number between 0.01 and 999999999.99 inclusive
   *   category – must be a non-empty string present in KNOWN_CATEGORIES
   */
  function validate(formData) {
    const errors = {};

    // --- name ---
    const name = typeof formData.name === 'string' ? formData.name.trim() : '';
    if (name.length < 1 || name.length > 100) {
      errors.name = 'Name is required and must be between 1 and 100 characters.';
    }

    // --- amount ---
    const amount = formData.amount;
    if (typeof amount !== 'number' || !isFinite(amount) || amount < 0.01 || amount > 999999999.99) {
      errors.amount = 'Amount must be a number between 0.01 and 999,999,999.99.';
    }

    // --- category ---
    const category = formData.category;
    if (typeof category !== 'string' || category.trim() === '' || !KNOWN_CATEGORIES.includes(category)) {
      errors.category = 'Category must be one of: ' + KNOWN_CATEGORIES.join(', ') + '.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  return { validate };
})();

// =============================================================
// ChartModule
// Manages the Chart.js pie chart for spending by category.
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
// =============================================================
const ChartModule = (function () {
  let chart = null;

  /**
   * update(transactions) → void
   * Redraws (or destroys) the pie chart based on the current transactions.
   * Groups by category, sums amounts, then creates or updates the Chart.js
   * instance. If there are no valid groups the placeholder is shown instead.
   */
  function update(transactions) {
    var canvas      = document.getElementById('spending-chart');
    var placeholder = document.getElementById('chart-placeholder');

    // Graceful CDN failure: Chart.js not loaded
    if (typeof Chart === 'undefined') {
      if (placeholder) placeholder.style.display = 'block';
      return;
    }

    // Group transactions by category and sum amounts
    var totals = {};
    transactions.forEach(function (tx) {
      if (!totals[tx.category]) {
        totals[tx.category] = 0;
      }
      totals[tx.category] += tx.amount;
    });

    // Keep only categories with a total > 0
    var validCategories = Object.keys(totals).filter(function (cat) {
      return totals[cat] > 0;
    });

    // No valid data — destroy any existing chart and show placeholder
    if (validCategories.length === 0) {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      if (placeholder) placeholder.style.display = 'block';
      return;
    }

    // Hide placeholder and build data arrays
    if (placeholder) placeholder.style.display = 'none';

    var labels = validCategories;
    var data   = validCategories.map(function (cat) { return totals[cat]; });

    var colorMap = { 'Food': '#f59e0b', 'Transport': '#3b82f6', 'Fun': '#10b981' };

    if (chart === null) {
      // Create a fresh Chart.js instance
      chart = new Chart(canvas, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: labels.map(function (label) {
              return colorMap[label] || '#6366f1';
            }),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    } else {
      // Update the existing chart to avoid flickering
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = labels.map(function (label) {
        return colorMap[label] || '#6366f1';
      });
      chart.update();
    }
  }

  return { update };
})();

// =============================================================
// Renderer
// Builds and updates the transaction list DOM, shows/clears
// validation errors, and resets the input form.
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1
// =============================================================
const Renderer = (function () {
    let currentSpendingLimit = 0;

  function setSpendingLimit(limit) {
    currentSpendingLimit = limit;
  }
  /**
   * render(transactions) → void
   * Clears the list, sorts transactions newest-first, then renders
   * one <li> per transaction (or shows the empty-state placeholder).
   * Calls ChartModule.update() when ChartModule is available.
   */
  function render(transactions, sortOrder) {
    const ul = document.getElementById('transaction-list');
    const placeholder = document.getElementById('list-placeholder');

    // Clear existing list items
    ul.innerHTML = '';

    // Sort a copy newest-first (original array untouched)
    let sorted = transactions.slice();

if (sortOrder === 'amount-asc') {
  sorted.sort(function (a, b) {
    return a.amount - b.amount;
  });
} else if (sortOrder === 'amount-desc') {
  sorted.sort(function (a, b) {
    return b.amount - a.amount;
  });
} else if (sortOrder === 'category') {
  sorted.sort(function (a, b) {
    return a.category.localeCompare(b.category);
  });
} else {
  sorted.sort(function (a, b) {
    return a.createdAt - b.createdAt;
  });
}

    if (sorted.length === 0) {
      placeholder.style.display = 'block';
      document.getElementById('total-balance').textContent = 'Rp 0,00';

      if (typeof ChartModule !== 'undefined') {
      ChartModule.update(transactions);
    }

  return;
}

    placeholder.style.display = 'none';

    sorted.forEach(function (tx) {
      const formattedAmount =
        'Rp ' +
        tx.amount.toLocaleString('id-ID', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.dataset.id = tx.id;

      li.innerHTML =
        '<div class="transaction-details">' +
          '<span class="transaction-name">' + _escapeHtml(tx.name) + '</span>' +
          '<span class="transaction-category category-badge">' + _escapeHtml(tx.category) + '</span>' +
        '</div>' +
        '<div class="transaction-right">' +
          '<span class="transaction-amount">' + formattedAmount + '</span>' +
          '<button class="btn-delete" data-id="' + tx.id + '" aria-label="Delete ' + _escapeHtml(tx.name) + '">🗑</button>' +
        '</div>';

      ul.appendChild(li);
    });

    // Update chart if available
    if (typeof ChartModule !== 'undefined') {
      ChartModule.update(transactions);
    }

    // Calculate and display the total balance (Requirements: 4.1, 4.2, 4.5)
    const total = transactions.reduce(function (sum, tx) { return sum + tx.amount; }, 0);
    const limitStatus = document.getElementById('limit-status');
const balanceDisplay = document.querySelector('.balance-display');

if (limitStatus && balanceDisplay) {
  if (currentSpendingLimit > 0 && total > currentSpendingLimit) {
    limitStatus.textContent = '⚠️ Spending limit exceeded!';
    balanceDisplay.classList.add('over-limit');
  } else if (currentSpendingLimit > 0) {
    limitStatus.textContent = 'Within spending limit.';
    balanceDisplay.classList.remove('over-limit');
  } else {
    limitStatus.textContent = '';
    balanceDisplay.classList.remove('over-limit');
  }
}
    const formattedTotal =
      'Rp ' +
      total.toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    document.getElementById('total-balance').textContent = formattedTotal;
  }

  /**
   * showErrors(errors) → void
   * Writes each validation error message into its corresponding
   * #error-<key> element.
   */
  function showErrors(errors) {
    Object.keys(errors).forEach(function (key) {
      const el = document.getElementById('error-' + key);
      if (el) {
        el.textContent = errors[key];
      }
    });
  }

  /**
   * clearErrors() → void
   * Resets the text content of all three error elements to ''.
   */
  function clearErrors() {
    ['name', 'amount', 'category'].forEach(function (field) {
      const el = document.getElementById('error-' + field);
      if (el) {
        el.textContent = '';
      }
    });
  }

  /**
   * resetForm() → void
   * Clears the name and amount inputs; resets the category select
   * back to its default disabled placeholder option (value = '').
   */
  function resetForm() {
    const nameInput = document.getElementById('input-name');
    const amountInput = document.getElementById('input-amount');
    const categorySelect = document.getElementById('select-category');

    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';
    if (categorySelect) categorySelect.value = '';
  }

  /**
   * _escapeHtml(str) → string
   * Escapes HTML special characters to prevent XSS when building
   * innerHTML strings from user-supplied data.
   */
  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return {
  render,
  showErrors,
  clearErrors,
  resetForm,
  setSpendingLimit
};
})();

// =============================================================
// AppController
// Bootstraps the application: loads state, wires up events,
// and kicks off the initial render.
// Requirements: 6.3
// =============================================================
const AppController = (function () {
  let transactions = [];
  let sortOrder = 'added';
  let spendingLimit = 0;

  /**
   * init() → void
   * Entry point called on DOMContentLoaded.
   * Loads persisted transactions, attaches event listeners,
   * and triggers the initial render (guarded until Renderer exists).
   */
  function init() {
        const savedLimit = localStorage.getItem('expense_visualizer_limit');

    if (savedLimit !== null) {
      spendingLimit = parseFloat(savedLimit) || 0;
      document.getElementById('limit-input').value = spendingLimit;
    }
    Renderer.setSpendingLimit(spendingLimit);
    // Load persisted state
    transactions = StorageModule.load();

    // Wire up form submission
    document.getElementById('transaction-form')
      .addEventListener('submit', handleFormSubmit);

    // Wire up delete via event delegation on the transaction list
    document.getElementById('transaction-list')
      .addEventListener('click', function (e) {
        const btn = e.target.closest('button[data-id]');
        if (btn) {
          handleDelete(btn.dataset.id);
        }
      });

    document.getElementById('sort-select')
      .addEventListener('change', function (e) {
        sortOrder = e.target.value;
        Renderer.render(transactions, sortOrder);
      });
      document.getElementById('limit-input')
  .addEventListener('input', function (e) {
    spendingLimit = parseFloat(e.target.value) || 0;
    localStorage.setItem(
      'expense_visualizer_limit',
      spendingLimit
    );
    Renderer.setSpendingLimit(spendingLimit);
    Renderer.render(transactions, sortOrder);
  });

  document.getElementById('theme-toggle')
  .addEventListener('click', function () {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';

    html.setAttribute('data-theme', isDark ? 'light' : 'dark');

    localStorage.setItem(
      'expense_visualizer_theme',
      isDark ? 'light' : 'dark'
    );

    this.textContent = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
  });

  const savedTheme = localStorage.getItem('expense_visualizer_theme');

if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', savedTheme);

  document.getElementById('theme-toggle').textContent =
    savedTheme === 'dark'
      ? '☀️ Light Mode'
      : '🌙 Dark Mode';
}
    // Render current state (also triggers ChartModule.update via Renderer.render)
    Renderer.render(transactions);
  }

  /**
   * handleFormSubmit(event) → void
   * Handles the form submit event.
   * Full implementation added in task 9.1.
   */
  function handleFormSubmit(event) {
    event.preventDefault();

    // Read form values
    const name     = document.getElementById('input-name').value;
    const amount   = parseFloat(document.getElementById('input-amount').value);
    const category = document.getElementById('select-category').value;

    // Validate
    Renderer.clearErrors();

    const result = Validator.validate({ name, amount, category });
    if (!result.valid) {
      Renderer.showErrors(result.errors);
      return;
    }

    // All good — clear any previous errors
    Renderer.clearErrors();

    // Persist and update local state
    transactions = StorageModule.addTransaction({ name: name.trim(), amount, category });

    // Re-render the list and reset the form
    Renderer.render(transactions);
    Renderer.resetForm();
  }

  /**
   * handleDelete(id) → void
   * Handles deletion of a transaction by id.
   * Full implementation added in task 10.1.
   */
  function handleDelete(id) {
    transactions = StorageModule.deleteTransaction(id);
    Renderer.render(transactions);
  }

  return { init };
})();

// =============================================================
// Bootstrap
// Kick off the app once the DOM is ready.
// =============================================================
document.addEventListener('DOMContentLoaded', AppController.init);
