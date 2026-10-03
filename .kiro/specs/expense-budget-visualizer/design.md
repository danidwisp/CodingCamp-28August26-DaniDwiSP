# Design Document — Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page web application that runs entirely in the browser. There is no backend, no server, and no build step. Everything lives in three files: `index.html`, `css/style.css`, and `js/app.js`. Chart.js is loaded from a CDN link inside `index.html`.

### How data flows through the app

The app follows a simple, one-way data flow:

```
User Gesture → State Mutation → Re-render
```

1. **User Gesture** — the user fills in the form and clicks "Add Transaction", or clicks "Delete" on an existing entry.
2. **State Mutation** — JavaScript reads the current state, modifies it (adds or removes a transaction), and saves the new state to `localStorage`.
3. **Re-render** — JavaScript reads the updated state and redraws the transaction list, total balance, and pie chart.

This pattern keeps the code predictable: the DOM is always rebuilt from the stored data, so the UI and the data are never out of sync.

### How `app.js` is organized

Because the project uses a single JavaScript file with no module bundler, the code is organized using the **IIFE module pattern** (Immediately Invoked Function Expression). Each logical group of functions is wrapped in its own IIFE that returns a plain object with public methods. This prevents variable name collisions and keeps related logic together.

```javascript
const StorageModule = (function () {
  // private variables and helpers here
  return {
    load,
    save,
    // ...
  };
})();
```

---

## Architecture

### File Structure

```
expense-budget-visualizer/
├── index.html          ← single HTML page
├── css/
│   └── style.css       ← all styles
└── js/
    └── app.js          ← all JavaScript logic
```

`index.html` loads Chart.js from the CDN **before** `app.js` so that `Chart` is available when `app.js` runs:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/app.js"></script>
```

---

### Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                     index.html                       │
│   (HTML structure, links to CSS, loads JS scripts)   │
└───────────────────────┬──────────────────────────────┘
                        │ DOM events (submit, click)
                        ▼
┌──────────────────────────────────────────────────────┐
│                      app.js                          │
│                                                      │
│  ┌─────────────────┐   ┌──────────────────────────┐  │
│  │  AppController  │──▶│       Validator          │  │
│  │  (entry point,  │   │  (form input checking)   │  │
│  │  event wiring)  │   └──────────────────────────┘  │
│  └────────┬────────┘                                 │
│           │                                          │
│    ┌──────┴──────┐                                   │
│    ▼             ▼                                   │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ Storage  │  │           Renderer               │  │
│  │ Module   │  │  (updates DOM: list, balance,    │  │
│  │(read/    │  │   error messages, form reset)    │  │
│  │ write    │  └──────────────┬───────────────────┘  │
│  │ local-   │                 │                      │
│  │ Storage) │        ┌────────▼──────────┐           │
│  └──────────┘        │   ChartModule     │           │
│                      │ (Chart.js pie     │           │
│                      │  chart updates)   │           │
│                      └───────────────────┘           │
└───────────┬──────────────────┬───────────────────────┘
            │                  │
            ▼                  ▼
     localStorage         Chart.js CDN
   (data persistence)   (pie chart drawing)
```

---

### Event / Data Flow

#### 4.1 — Page Load

```
Browser loads index.html
        │
        ▼
DOMContentLoaded fires
        │
        ▼
AppController.init()
        │
        ├─▶ StorageModule.load()
        │         └─▶ reads localStorage key "expense_visualizer_transactions"
        │               ├─ found valid JSON array → return it
        │               └─ missing / invalid JSON → return []
        │
        ├─▶ stores array in module-scoped `transactions` variable
        │
        └─▶ Renderer.render(transactions)
                  ├─▶ updates transaction list in the DOM
                  ├─▶ updates total balance display
                  └─▶ ChartModule.update(transactions)
                            └─▶ draws pie chart (or shows placeholder)
```

#### 4.2 — Add Transaction (form submit)

```
User fills in form and clicks "Add" (or presses Enter)
        │
        ▼
AppController.handleFormSubmit(event)
        │
        ├─▶ event.preventDefault()   ← stop page reload
        │
        ├─▶ reads form values (name, amount, category)
        │
        ├─▶ Validator.validate(formData)
        │         ├─ { valid: false, errors: {...} }
        │         │       └─▶ Renderer.showErrors(errors) → show inline messages, STOP
        │         │
        │         └─ { valid: true }
        │               └─▶ Renderer.clearErrors()
        │
        ├─▶ StorageModule.addTransaction(newTransaction)
        │         ├─▶ appends new Transaction object to array
        │         ├─▶ StorageModule.save(transactions) → writes to localStorage
        │         └─▶ returns updated array
        │
        ├─▶ updates module-scoped `transactions` variable
        │
        ├─▶ Renderer.render(transactions)
        │         ├─▶ updates transaction list
        │         ├─▶ updates total balance
        │         └─▶ ChartModule.update(transactions)
        │
        └─▶ Renderer.resetForm()   ← clear fields ready for next entry
```

#### 4.3 — Delete Transaction

```
User clicks delete button on a transaction entry
        │
        ▼
AppController.handleDelete(id)
        │
        ├─▶ StorageModule.deleteTransaction(id)
        │         ├─▶ filters out the entry with matching id
        │         ├─▶ StorageModule.save(transactions) → writes to localStorage
        │         └─▶ returns updated array
        │
        ├─▶ updates module-scoped `transactions` variable
        │
        └─▶ Renderer.render(transactions)
                  ├─▶ updates transaction list
                  ├─▶ updates total balance
                  └─▶ ChartModule.update(transactions)
```

---

## Components and Interfaces

All modules are written as IIFEs and stored in `const` variables. `AppController.init()` is called once at the bottom of the file when `DOMContentLoaded` fires.

---

### StorageModule

Handles all reading from and writing to `localStorage`. Nothing else in the app touches `localStorage` directly.

**Storage key:** `"expense_visualizer_transactions"`

| Method | Signature | Description |
|--------|-----------|-------------|
| `load` | `load() → Transaction[]` | Reads the storage key, JSON-parses it, and returns the array. Returns `[]` if the key is missing, the value is invalid JSON, or the parsed result is not an array. Never throws. |
| `save` | `save(transactions) → void` | Serializes the array with `JSON.stringify` and writes it to the storage key. Wraps the write in a try/catch so a storage-quota error is logged but does not crash the app. |
| `addTransaction` | `addTransaction(tx) → Transaction[]` | Appends `tx` to the current array, calls `save`, returns the updated array. |
| `deleteTransaction` | `deleteTransaction(id) → Transaction[]` | Filters out the entry whose `id` matches, calls `save`, returns the updated array. |

---

### Validator

Checks form data before it is accepted. Has no side effects — it only reads input and returns a result object.

| Method | Signature | Description |
|--------|-----------|-------------|
| `validate` | `validate(formData) → { valid: boolean, errors: object }` | Checks all three fields. `errors` may contain keys `name`, `amount`, and/or `category`, each holding a human-readable error string. If all fields pass, returns `{ valid: true, errors: {} }`. |

**Validation rules:**

| Field | Rule |
|-------|------|
| `name` | Non-empty after trimming; trimmed length between 1 and 100 characters |
| `amount` | Must be a finite number; value between 0.01 and 999,999,999.99 (inclusive) |
| `category` | Non-empty string; must be one of the known category strings |

---

### Renderer

Updates the DOM to match the current state. Called after every state change. Never reads from `localStorage` directly — it always receives the `transactions` array as an argument.

| Method | Signature | Description |
|--------|-----------|-------------|
| `render` | `render(transactions) → void` | Rebuilds the `<ul id="transaction-list">` from scratch, recalculates and displays the total balance, and calls `ChartModule.update()`. If the array is empty, shows the empty-state message. |
| `showErrors` | `showErrors(errors) → void` | For each key in `errors`, finds the matching `<span class="field-error">` next to that field and sets its text content. |
| `clearErrors` | `clearErrors() → void` | Sets the text content of every `<span class="field-error">` to an empty string. |
| `resetForm` | `resetForm() → void` | Clears the name input, clears the amount input, resets the category select to its default "no selection" option. |

**Rendering a transaction list item:**

Each `<li>` contains:
- The item name
- The amount formatted to two decimal places with a currency symbol (e.g. `Rp 12.500,00` or `$12.50` — choose one and apply consistently)
- A category badge (a small `<span>` with the category name)
- A delete `<button>` with `aria-label="Delete [item name]"` for screen-reader accessibility

---

### ChartModule

Manages a single Chart.js pie chart instance.

| Method | Signature | Description |
|--------|-----------|-------------|
| `update` | `update(transactions) → void` | Groups transactions by category, sums amounts per category, excludes categories whose total is ≤ 0. If there is at least one valid category, creates the chart (if it does not exist yet) or mutates `chart.data` and calls `chart.update()` to avoid flickering. If there are no transactions, destroys the chart instance and shows the `<p id="chart-placeholder">` text. |

**Why mutate instead of recreate?** Destroying and recreating a Chart.js instance on every change causes a visible flash. Mutating `chart.data.labels`, `chart.data.datasets[0].data`, and then calling `chart.update()` produces a smooth animated transition.

---

### AppController

The entry point and event coordinator. Holds the in-memory `transactions` array as a module-scoped variable.

| Method | Signature | Description |
|--------|-----------|-------------|
| `init` | `init() → void` | Called on `DOMContentLoaded`. Loads state from `StorageModule`, stores it in the local `transactions` variable, calls `Renderer.render()`, and wires up event listeners on the form and transaction list. |
| `handleFormSubmit` | `handleFormSubmit(event) → void` | Prevents default form submission, reads form values, runs the Validator, shows errors or proceeds to add the transaction and re-render. |
| `handleDelete` | `handleDelete(id) → void` | Calls `StorageModule.deleteTransaction(id)`, updates the local array, re-renders. |

**Event delegation for delete buttons:** Rather than attaching a listener to each delete button, `AppController` attaches a single `click` listener to the `<ul id="transaction-list">`. When a click reaches the list, it checks whether the target has a `data-id` attribute (set on the delete button during rendering). This is more efficient and works correctly even after the list is rebuilt.

---

### Optional Modules (inside `app.js`, conditionally active)

#### CategoryModule (Optional Feature A)

Manages custom user-defined categories alongside the built-in defaults.

**Storage key:** `"expense_visualizer_categories"`

| Method | Signature | Description |
|--------|-----------|-------------|
| `loadCategories` | `loadCategories() → string[]` | Returns a merged array of `DEFAULT_CATEGORIES` plus any custom categories stored in localStorage. |
| `addCategory` | `addCategory(name) → { success: boolean, error?: string, categories?: string[] }` | Validates the new name (non-empty, not duplicate, max 50 chars), saves to localStorage if valid, returns the updated list. |
| `populateDropdown` | `populateDropdown(categories) → void` | Clears the category `<select>` and rebuilds its `<option>` elements from the given array. |

---

#### SortModule (Optional Feature B)

Provides display-only sorting. **Never modifies the stored array.**

| Method | Signature | Description |
|--------|-----------|-------------|
| `sort` | `sort(transactions, key, dir) → Transaction[]` | Returns a new sorted array. `key` is `'amount'` or `'category'`; `dir` is `'asc'` or `'desc'`. The original array is not mutated. |

The active sort preference is stored in a module-scoped variable and re-applied inside `Renderer.render()` before building the list.

---

#### ThemeModule (Optional Feature C)

Controls dark/light mode.

**Storage key:** `"expense_visualizer_theme"`

| Method | Signature | Description |
|--------|-----------|-------------|
| `init` | `init() → void` | Reads the stored preference from localStorage; applies `data-theme="dark"` or `data-theme="light"` to `<html>`. Defaults to `"light"` if nothing is stored. |
| `toggle` | `toggle() → void` | Reads the current `data-theme` value, flips it, updates the `<html>` attribute, and persists the new preference. |

---

## Data Models

### Transaction Object

```javascript
{
  id:        string,   // unique ID — crypto.randomUUID() when available, Math.random() fallback
  name:      string,   // trimmed, 1–100 characters
  amount:    number,   // >= 0.01 and <= 999,999,999.99
  category:  string,   // one of the known category strings
  createdAt: number    // Date.now() — used to sort newest-first
}
```

**Generating an ID:**

```javascript
const id = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);
```

### Default Categories

```javascript
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
```

### localStorage Keys

| Key | Value format | Purpose |
|-----|-------------|---------|
| `expense_visualizer_transactions` | JSON array of Transaction objects | All transactions |
| `expense_visualizer_categories` | JSON array of strings | Optional A: custom categories |
| `expense_visualizer_theme` | `"dark"` or `"light"` | Optional C: theme preference |

---

## HTML Structure

Below is the full annotated skeleton for `index.html`. The JavaScript fills in the dynamic parts (transaction list items, chart) at runtime.

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <!-- viewport meta tag is required for mobile responsiveness -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense &amp; Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <!-- ========================================================
       HEADER — always visible at the top; shows total balance
  ========================================================= -->
  <header class="app-header">
    <h1>Expense Tracker</h1>

    <!-- Total balance display — updated by Renderer -->
    <div class="balance-display">
      <span class="balance-label">Total Spending</span>
      <span id="total-balance">Rp 0,00</span>
    </div>

    <!-- Optional C: dark/light mode toggle button -->
    <!-- <button id="theme-toggle" aria-label="Toggle dark mode">🌙</button> -->
  </header>

  <main class="app-main">

    <!-- ========================================================
         TRANSACTION FORM
    ========================================================= -->
    <section class="form-section">
      <h2>Add Transaction</h2>

      <form id="transaction-form" novalidate>

        <!-- Item Name field -->
        <div class="field-group">
          <label for="input-name">Item Name</label>
          <input
            type="text"
            id="input-name"
            name="name"
            placeholder="e.g. Coffee"
            autocomplete="off"
          />
          <!-- Validator writes error text here -->
          <span class="field-error" id="error-name" aria-live="polite"></span>
        </div>

        <!-- Amount field -->
        <div class="field-group">
          <label for="input-amount">Amount</label>
          <input
            type="number"
            id="input-amount"
            name="amount"
            placeholder="e.g. 15000"
            min="0.01"
            step="0.01"
          />
          <span class="field-error" id="error-amount" aria-live="polite"></span>
        </div>

        <!-- Category dropdown -->
        <div class="field-group">
          <label for="select-category">Category</label>
          <select id="select-category" name="category">
            <option value="" disabled selected>-- Select a category --</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Fun">Fun</option>
            <!-- Optional A: CategoryModule.populateDropdown() rebuilds these options -->
          </select>
          <span class="field-error" id="error-category" aria-live="polite"></span>
        </div>

        <!-- Optional A: add-category inline form -->
        <!--
        <div class="field-group add-category-group">
          <label for="input-new-category">New Category</label>
          <input type="text" id="input-new-category" placeholder="e.g. Health" />
          <button type="button" id="btn-add-category">Add Category</button>
          <span class="field-error" id="error-new-category" aria-live="polite"></span>
        </div>
        -->

        <button type="submit" class="btn-primary">Add Transaction</button>

      </form>
    </section>

    <!-- ========================================================
         PIE CHART
    ========================================================= -->
    <section class="chart-section">
      <h2>Spending by Category</h2>

      <!-- Chart.js draws inside this canvas element -->
      <canvas id="spending-chart" aria-label="Spending pie chart" role="img"></canvas>

      <!-- Shown when there are no transactions; hidden otherwise -->
      <p id="chart-placeholder" class="placeholder-text">
        No spending data yet. Add a transaction to see your chart.
      </p>
    </section>

    <!-- ========================================================
         TRANSACTION LIST
    ========================================================= -->
    <section class="list-section">
      <h2>Transactions</h2>

      <!-- Optional B: sort controls -->
      <!--
      <div class="sort-controls">
        <button type="button" data-sort="amount-asc">Amount ↑</button>
        <button type="button" data-sort="amount-desc">Amount ↓</button>
        <button type="button" data-sort="category-asc">Category A–Z</button>
      </div>
      -->

      <!-- Renderer rebuilds this list on every state change.
           A single click listener on the <ul> handles all delete buttons. -->
      <ul id="transaction-list">
        <!-- Renderer inserts <li> elements here. Example structure:

        <li class="transaction-item" data-id="abc123">
          <div class="transaction-details">
            <span class="transaction-name">Coffee</span>
            <span class="transaction-category category-badge">Food</span>
          </div>
          <div class="transaction-right">
            <span class="transaction-amount">Rp 15.000,00</span>
            <button
              class="btn-delete"
              data-id="abc123"
              aria-label="Delete Coffee"
            >🗑</button>
          </div>
        </li>

        -->
      </ul>

      <!-- Shown when the list is empty; hidden otherwise -->
      <p id="list-placeholder" class="placeholder-text">
        No transactions added yet.
      </p>
    </section>

  </main>

  <!-- Chart.js must come BEFORE app.js so the Chart global is available -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="js/app.js"></script>

</body>
</html>
```

---

## CSS Approach

### Strategy

The stylesheet uses **mobile-first** design: base styles target the smallest screen (320px wide), and a single media query at `768px` adjusts the layout for tablets and desktops.

### Global Reset and Box Model

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

### CSS Custom Properties (Design Tokens)

All colors and the base font size are defined as CSS variables on `:root`. This makes it easy to support dark mode (Optional C) by overriding just these variables.

```css
:root {
  --color-bg:         #ffffff;
  --color-surface:    #f5f5f5;
  --color-text:       #1a1a1a;
  --color-text-muted: #6b6b6b;
  --color-primary:    #2563eb;
  --color-danger:     #dc2626;
  --color-border:     #d1d5db;
  --color-error:      #dc2626;
  --font-size-base:   16px;
  --radius:           8px;
}

[data-theme="dark"] {
  --color-bg:         #111827;
  --color-surface:    #1f2937;
  --color-text:       #f9fafb;
  --color-text-muted: #9ca3af;
  --color-primary:    #3b82f6;
  --color-danger:     #ef4444;
  --color-border:     #374151;
}
```

All text/background pairs in this palette meet the **WCAG 2.1 AA** minimum contrast ratio of 4.5:1.

### Key Layout Rules

| Rule | How it's applied |
|------|-----------------|
| Base font size ≥ 16px | `body { font-size: var(--font-size-base); }` |
| Transaction list scrolls | `#transaction-list { max-height: 400px; overflow-y: auto; }` |
| Touch-friendly tap targets on mobile | `@media (max-width: 767px)` — inputs, selects, and buttons get `min-height: 44px` |
| Single-column on mobile, two-column on desktop | Default is single column; `@media (min-width: 768px)` uses CSS Grid or Flexbox to place form and chart side by side |
| No horizontal scrolling | `body { overflow-x: hidden; }` and all widths use `%` or `max-width` |

### Responsive Breakpoint

```css
/* Mobile base styles: single column, full width */
.app-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

/* Desktop: place form and chart side by side */
@media (min-width: 768px) {
  .app-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  /* Transaction list spans full width below the two-column row */
  .list-section {
    grid-column: 1 / -1;
  }
}
```

---

## Optional Features Design

### A — Custom Categories

A small inline form is placed directly below the category `<select>` in the transaction form. It contains a text input and a button. When the user submits a new category name:

1. `CategoryModule.addCategory(name)` validates the input (non-empty after trimming, not already in the list, max 50 characters).
2. If valid, the new name is appended to the saved list in localStorage and `CategoryModule.populateDropdown()` rebuilds the `<select>` options immediately.
3. If invalid, an inline error message appears next to the input.

Custom categories are merged with `DEFAULT_CATEGORIES` on every page load so no saved transaction ever references a missing category.

### B — Transaction Sorting

Sort controls appear above the `<ul id="transaction-list">` as a small group of buttons (or a `<select>`). Available options:

- **Amount (ascending)** — cheapest first
- **Amount (descending)** — most expensive first
- **Category (A–Z)** — alphabetical

When the user picks a sort option, `SortModule.sort()` returns a new sorted copy of the transactions array. `Renderer.render()` receives this sorted copy for display. **The original insertion-order array in `StorageModule` is never touched** — sorting is purely cosmetic.

The active sort key and direction are kept in a module-scoped variable inside `SortModule`. `Renderer.render()` checks this variable and applies the sort before building the list, so the chosen order persists even after adding or deleting transactions.

### C — Dark/Light Mode Toggle

A toggle button (🌙 / ☀️ icon) sits in the `<header>`. Clicking it calls `ThemeModule.toggle()`, which:

1. Reads the current `data-theme` attribute from `<html>`.
2. Flips it to the opposite value.
3. Updates the `<html>` attribute — all CSS custom properties change instantly because they are defined on `[data-theme="dark"]`.
4. Saves the new preference to localStorage.

On page load, `ThemeModule.init()` restores the saved preference so the user's choice persists across sessions.

**Chart.js and themes:** Chart.js reads colors from its own configuration, not from CSS variables. After a theme toggle, `ChartModule.update()` should be called with the current transactions so the chart is redrawn with updated text/grid colors that match the new theme.

---

## Error Handling

| Scenario | How it is handled |
|----------|------------------|
| `localStorage.getItem()` throws or returns invalid JSON | `StorageModule.load()` wraps the read in a `try/catch`. Any error returns `[]`. The app starts with an empty list. |
| `localStorage.setItem()` throws (e.g. storage quota exceeded) | `StorageModule.save()` wraps the write in a `try/catch`. The error is logged to `console.error`. The in-memory state is unchanged; the user sees the new transaction in the UI even though it was not persisted. A future enhancement could show a warning banner. |
| Chart.js CDN fails to load | `ChartModule.update()` checks `typeof Chart !== 'undefined'` before trying to create a chart. If Chart.js is unavailable, it skips chart rendering and leaves the placeholder text visible. The rest of the app (form, list, balance) continues to work normally. |
| `crypto.randomUUID()` not available (older browser) | The ID generation falls back to `Math.random().toString(36).slice(2)`. This is sufficient for client-side uniqueness. |
| Form submitted with all fields empty | `Validator.validate()` returns errors for all three fields. `Renderer.showErrors()` displays all three inline messages. No transaction is created. |
| Delete clicked for a transaction ID that does not exist | `StorageModule.deleteTransaction(id)` uses `Array.filter()`. If no entry matches, the array is returned unchanged. No error is thrown. `Renderer.render()` is still called, so the UI stays consistent. |

---

## Correctness Properties

These are **design-level behavioral statements** — they describe what the code must do. They are intended to guide implementation and to serve as a checklist during manual browser testing and code review. No automated testing infrastructure is required.

---

### Property 1: — Validator accepts all valid inputs

For any item name with a trimmed length between 1 and 100 characters, any amount in the range [0.01, 999,999,999.99], and any category string that belongs to the known category list, `Validator.validate()` must return `{ valid: true }` with no error messages.

**Validates: Requirements 1.3, 1.4, 1.5**

---

### Property 2: — Validator rejects all invalid inputs

For any form submission where at least one field fails its validation rule, `Validator.validate()` must return `{ valid: false }` with a non-empty error string on each field that failed. Valid fields must not have an error string.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 3: — Adding a transaction grows the list by exactly one

After calling `StorageModule.addTransaction(tx)`, the returned array must have a length exactly one greater than before the call, and the last-added entry must contain the same `name`, `amount`, and `category` that were passed in.

**Validates: Requirements 1.7, 2.1, 6.1**

---

### Property 4: — Transaction list renders all transactions with correct fields and a delete button

After `Renderer.render(transactions)` runs, the `<ul id="transaction-list">` must contain exactly one `<li>` for every transaction in the array. Each `<li>` must display the item name, the amount formatted to two decimal places with a currency symbol, the category, and a delete button.

**Validates: Requirements 2.1, 2.2, 3.1**

---

### Property 5: — Transaction list is ordered newest-first

After `Renderer.render(transactions)`, the list item at the top of the `<ul>` must correspond to the transaction with the highest `createdAt` timestamp. Each subsequent item must have an equal or earlier timestamp than the one above it.

**Validates: Requirement 2.4**

---

### Property 6: — Delete removes exactly the targeted transaction and no others

After `StorageModule.deleteTransaction(id)`, the returned array must not contain any entry whose `id` equals the one that was deleted. Every other entry that was in the array before the call must still be present with all its fields unchanged.

**Validates: Requirements 3.2, 3.3**

---

### Property 7: — Total balance equals the sum of all transaction amounts

At any point after `Renderer.render(transactions)`, the value displayed in `#total-balance` must equal the arithmetic sum of all `amount` fields in the transactions array. When the array is empty, the displayed value must be zero.

**Validates: Requirements 4.2, 4.5**

---

### Property 8: — Category aggregation correctly sums amounts and excludes zero/negative totals

When `ChartModule.update(transactions)` calculates the data for the pie chart, it must group all transactions by category, sum the amounts within each group, and include only those groups whose total is greater than zero. Any category whose summed total is zero or negative must not appear as a segment.

**Validates: Requirements 5.2, 5.7**

---

### Property 9: — Storage round-trip preserves transaction data

After `StorageModule.save(transactions)` is called and then `StorageModule.load()` is called (simulating a page reload), the returned array must be deeply equal to the array that was saved: same length, same order, and every field on every object must have the same value.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 10: — Malformed storage data is handled gracefully

If `localStorage` contains a value under `"expense_visualizer_transactions"` that is not valid JSON, or is valid JSON but not an array (for example a plain string, a number, or an object), `StorageModule.load()` must return an empty array `[]` without throwing any error.

**Validates: Requirements 6.4, 6.5**

---

> These properties describe the expected behavior to verify manually in the browser and during code review. No automated test infrastructure is required or expected for this assignment.

---

## Testing Strategy

This project is a beginner-level assignment. No automated test framework, test runner, or testing library is required or used.

Verification is done through **manual browser testing**:

- Open `index.html` directly in a browser (no server needed).
- Test each feature by interacting with the UI and observing the results.
- Use the browser's DevTools console to inspect `localStorage` and check for JavaScript errors.
- Use the Correctness Properties in this document as a manual checklist to verify behavior during development.

The Correctness Properties (P1–P10) describe the expected behaviors to check manually — they are not automated test code.
