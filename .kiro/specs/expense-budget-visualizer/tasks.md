# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page expense tracker using only `index.html`, `css/style.css`, and `js/app.js`. Chart.js is loaded from a CDN. All data is persisted in `localStorage`. No frameworks, build tools, or testing libraries are used. Each task is small and verifiable by opening `index.html` directly in a browser.

---

## Tasks

- [x] 1. Project Setup
  - [x] 1.1 Create the three project files
    - Create `index.html` at the project root with a minimal HTML5 boilerplate (`<!DOCTYPE html>`, `<html lang="en">`, `<head>`, `<body>`)
    - Create `css/style.css` as an empty file
    - Create `js/app.js` as an empty file
    - In `index.html` `<head>`, add `<link rel="stylesheet" href="css/style.css" />`
    - In `index.html` before `</body>`, add the Chart.js CDN script tag: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
    - After the Chart.js tag, add `<script src="js/app.js"></script>`
    - _Requirements: 8.1, 8.2, 8.3_
    - **Verify:** Open `index.html` in a browser. The page loads with no errors in DevTools Console. `typeof Chart` returns `"function"` in the console.

- [x] 2. HTML Structure
  - [x] 2.1 Add the page header with total balance display
    - Inside `<body>`, add `<header class="app-header">` containing an `<h1>Expense Tracker</h1>`
    - Inside the header, add a `<div class="balance-display">` with a `<span class="balance-label">Total Spending</span>` and `<span id="total-balance">Rp 0,00</span>`
    - _Requirements: 4.1, 4.5_
    - **Verify:** Open in browser. You see "Expense Tracker" heading and "Rp 0,00" balance text.

  - [x] 2.2 Add the transaction form section
    - After the header, add `<main class="app-main">`
    - Inside main, add `<section class="form-section">` with `<h2>Add Transaction</h2>`
    - Add `<form id="transaction-form" novalidate>` containing three `<div class="field-group">` blocks:
      - Name field: `<label for="input-name">`, `<input type="text" id="input-name" name="name" placeholder="e.g. Coffee" autocomplete="off" />`, `<span class="field-error" id="error-name" aria-live="polite"></span>`
      - Amount field: `<label for="input-amount">`, `<input type="number" id="input-amount" name="amount" placeholder="e.g. 15000" min="0.01" step="0.01" />`, `<span class="field-error" id="error-amount" aria-live="polite"></span>`
      - Category field: `<label for="select-category">`, `<select id="select-category" name="category">` with a disabled default option and three `<option>` elements for "Food", "Transport", "Fun"`, `<span class="field-error" id="error-category" aria-live="polite"></span>`
    - Add `<button type="submit" class="btn-primary">Add Transaction</button>` inside the form
    - _Requirements: 1.1, 1.2_
    - **Verify:** Open in browser. You see the form with three labeled fields and a submit button.

  - [x] 2.3 Add the pie chart section and transaction list section
    - After the form section (still inside `<main>`), add `<section class="chart-section">` with `<h2>Spending by Category</h2>`, `<canvas id="spending-chart" aria-label="Spending pie chart" role="img"></canvas>`, and `<p id="chart-placeholder" class="placeholder-text">No spending data yet. Add a transaction to see your chart.</p>`
    - After the chart section, add `<section class="list-section">` with `<h2>Transactions</h2>`, `<ul id="transaction-list"></ul>`, and `<p id="list-placeholder" class="placeholder-text">No transactions added yet.</p>`
    - Close `</main>` after the list section
    - _Requirements: 5.5, 2.5_
    - **Verify:** Open in browser. You see the chart section and the list section with their placeholder text. No JavaScript errors in the console.

- [x] 3. CSS Baseline
  - [x] 3.1 Add global reset, CSS custom properties, and base typography
    - In `css/style.css`, add a universal box-sizing reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
    - Add CSS custom properties on `:root` for all color tokens: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-danger`, `--color-border`, `--color-error`, `--font-size-base: 16px`, `--radius: 8px` (use the exact values from the design document)
    - Set `body { font-family: sans-serif; font-size: var(--font-size-base); background-color: var(--color-bg); color: var(--color-text); overflow-x: hidden; }`
    - _Requirements: 7.1, 7.3, 8.3_
    - **Verify:** Open in browser. Page background and text colors have changed. Body font is at least 16px (check in DevTools Computed styles).

  - [x] 3.2 Style the header, balance display, and basic form elements
    - Style `.app-header` with padding, background using `--color-surface`, and a bottom border
    - Style `.balance-display` and `#total-balance` so the balance value is visually prominent (larger font size, bold)
    - Style `.form-section`, `.field-group`, `label`, `input`, `select` with consistent spacing, border using `--color-border`, border-radius using `--radius`, and width `100%`
    - Style `.btn-primary` with background `--color-primary`, white text, padding, border-radius, and cursor `pointer`
    - Style `.field-error` with color `--color-error` and small font size
    - _Requirements: 7.3, 1.1_
    - **Verify:** Open in browser. The header, form fields, and button look clean and readable.

  - [x] 3.3 Add app layout (centered, max-width) and mobile-first single-column layout
    - Style `.app-main` with `display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem; max-width: 900px; margin: 0 auto;`
    - Style `#transaction-list` with `max-height: 400px; overflow-y: auto; list-style: none; padding: 0;`
    - Style `.placeholder-text` with `color: var(--color-text-muted); text-align: center; padding: 1rem;`
    - Add basic styles for `.transaction-item` list items with padding, border-bottom, and flex layout to put item details on the left and amount + delete button on the right
    - Style `.category-badge` as a small inline label with padding and background color
    - Style `.btn-delete` with a minimal appearance (no border, background transparent, cursor pointer, `color: var(--color-danger)`)
    - _Requirements: 7.1, 2.2_
    - **Verify:** Open in browser on a narrow viewport (375px). All content is readable in a single column with no horizontal scroll.

- [x] 4. StorageModule
  - [x] 4.1 Implement StorageModule as an IIFE with `load()` and `save()`
    - In `js/app.js`, write the `StorageModule` IIFE:
      ```js
      const StorageModule = (function () {
        const KEY = 'expense_visualizer_transactions';
        function load() { /* ... */ }
        function save(transactions) { /* ... */ }
        return { load, save };
      })();
      ```
    - `load()`: wrap in `try/catch`; call `localStorage.getItem(KEY)`; JSON-parse the result; if it is a valid array return it, otherwise return `[]`
    - `save(transactions)`: wrap in `try/catch`; call `localStorage.setItem(KEY, JSON.stringify(transactions))`; log any error with `console.error`
    - _Requirements: 6.3, 6.4, 6.5_
    - **Verify:** In DevTools console, run `StorageModule.load()` — it returns `[]`. Run `StorageModule.save([{id:'1',name:'Test',amount:5000,category:'Food',createdAt:Date.now()}])` then `StorageModule.load()` — it returns the array you saved.

  - [x] 4.2 Add `addTransaction()` and `deleteTransaction()` to StorageModule
    - Extend the IIFE to include:
      - `addTransaction(tx)`: calls `load()`, pushes `tx` onto the array, calls `save()`, returns the updated array
      - `deleteTransaction(id)`: calls `load()`, filters out the entry with matching `id`, calls `save()`, returns the updated array
    - For `addTransaction`, generate the transaction `id` using `crypto.randomUUID()` with a `Math.random()` fallback; set `createdAt` to `Date.now()`
    - _Requirements: 2.1, 3.2, 6.1, 6.2_
    - **Verify:** In DevTools console, call `StorageModule.addTransaction({name:'Coffee',amount:15000,category:'Food'})` and check the returned array has one item with an `id` and `createdAt`. Call `deleteTransaction` with that id and confirm the array is now empty.

- [x] 5. Validator
  - [x] 5.1 Implement Validator as an IIFE with `validate()`
    - In `js/app.js`, write the `Validator` IIFE after `StorageModule`:
      ```js
      const Validator = (function () {
        const KNOWN_CATEGORIES = ['Food', 'Transport', 'Fun'];
        function validate(formData) { /* ... */ }
        return { validate };
      })();
      ```
    - `validate(formData)` checks three rules and builds an `errors` object:
      - `name`: trimmed length must be between 1 and 100 characters; if invalid, set `errors.name` to a descriptive message
      - `amount`: must be a finite number; value must be between 0.01 and 999999999.99 inclusive; if invalid, set `errors.amount` to a descriptive message
      - `category`: must be a non-empty string that exists in `KNOWN_CATEGORIES`; if invalid, set `errors.category` to a descriptive message
    - Return `{ valid: Object.keys(errors).length === 0, errors }`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
    - **Verify:** In DevTools console, call `Validator.validate({name:'',amount:-1,category:''})` — expect `valid: false` with all three error keys. Call `Validator.validate({name:'Coffee',amount:15000,category:'Food'})` — expect `valid: true`.

- [x] 6. AppController Bootstrap
  - [x] 6.1 Implement AppController IIFE with `init()` and form submit wiring
    - In `js/app.js`, write the `AppController` IIFE after `Validator`:
      ```js
      const AppController = (function () {
        let transactions = [];
        function init() { /* ... */ }
        function handleFormSubmit(event) { /* placeholder */ }
        function handleDelete(id) { /* placeholder */ }
        return { init };
      })();
      ```
    - `init()`:
      - Loads state: `transactions = StorageModule.load()`
      - Attaches `handleFormSubmit` to the form's `submit` event: `document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit)`
      - Attaches event delegation for delete to the list: `document.getElementById('transaction-list').addEventListener('click', function(e) { if (e.target.dataset.id) handleDelete(e.target.dataset.id); })`
      - Calls `Renderer.render(transactions)` (stub is fine — Renderer will be implemented next)
    - At the bottom of `app.js`, outside all IIFEs, add: `document.addEventListener('DOMContentLoaded', AppController.init)`
    - _Requirements: 6.3_
    - **Verify:** Open `index.html` in browser. No errors appear in the DevTools console on page load.

- [x] 7. Renderer — Transaction List
  - [x] 7.1 Implement Renderer IIFE with `render()` for the transaction list
    - In `js/app.js`, write the `Renderer` IIFE before `AppController`:
      ```js
      const Renderer = (function () {
        function render(transactions) { /* ... */ }
        function showErrors(errors) { /* ... */ }
        function clearErrors() { /* ... */ }
        function resetForm() { /* ... */ }
        return { render, showErrors, clearErrors, resetForm };
      })();
      ```
    - `render(transactions)`:
      - Gets `ul = document.getElementById('transaction-list')` and `placeholder = document.getElementById('list-placeholder')`
      - Clears the list: `ul.innerHTML = ''`
      - Sorts transactions newest-first: create a copy sorted by `createdAt` descending
      - If the array is empty, show the placeholder (`placeholder.style.display = 'block'`) and return
      - Otherwise hide the placeholder and build one `<li class="transaction-item">` per transaction:
        - The `<li>` contains the item name, the amount formatted with a currency symbol and two decimal places, a `<span class="category-badge">` with the category name, and a `<button class="btn-delete" data-id="[tx.id]" aria-label="Delete [tx.name]">🗑</button>`
      - Append each `<li>` to `ul`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1_
    - **Verify:** Temporarily call `Renderer.render([{id:'1',name:'Coffee',amount:15000,category:'Food',createdAt:Date.now()}])` from the console. One list item appears with the name, formatted amount, category badge, and delete button.

- [x] 8. Renderer — Total Balance
  - [x] 8.1 Update `render()` to calculate and display the total balance
    - Inside `Renderer.render()`, after rebuilding the list, calculate total: `const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)`
    - Format the total as a currency string (e.g. `Rp ${total.toLocaleString('id-ID', {minimumFractionDigits:2, maximumFractionDigits:2})}` or a consistent two-decimal format of your choice)
    - Set `document.getElementById('total-balance').textContent = formattedTotal`
    - When the array is empty, display `Rp 0,00` (or your chosen zero format)
    - _Requirements: 4.1, 4.2, 4.5_
    - **Verify:** Call `Renderer.render([])` from the console — balance shows `Rp 0,00`. Call with one transaction of amount `15000` — balance updates correctly.

- [x] 9. Form Submission Flow
  - [x] 9.1 Implement `handleFormSubmit` to wire Validator → StorageModule → Renderer
    - Fill in `handleFormSubmit(event)` in `AppController`:
      - `event.preventDefault()`
      - Read form values: `name` from `#input-name`, `amount` from `#input-amount` (parse as float), `category` from `#select-category`
      - Call `const result = Validator.validate({ name, amount, category })`
      - If `!result.valid`: call `Renderer.showErrors(result.errors)` and return
      - Otherwise: call `Renderer.clearErrors()`
      - Build a transaction object `{ name: name.trim(), amount, category }` and pass it to `StorageModule.addTransaction()`; store the returned array in `transactions`
      - Call `Renderer.render(transactions)`
      - Call `Renderer.resetForm()`
    - Implement `Renderer.showErrors(errors)`: for each key in `errors`, set `document.getElementById('error-' + key).textContent = errors[key]`
    - Implement `Renderer.clearErrors()`: for each of `['name','amount','category']`, set `document.getElementById('error-' + field).textContent = ''`
    - Implement `Renderer.resetForm()`: clear `#input-name` and `#input-amount` values; reset `#select-category` to its default disabled option
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
    - **Verify:** Open in browser. Submit the form empty — three inline error messages appear. Fill in valid values and submit — transaction appears in the list, balance updates, form fields clear.

- [x] 10. Delete Transaction
  - [x] 10.1 Implement `handleDelete(id)` using event delegation
    - Fill in `handleDelete(id)` in `AppController`:
      - Call `StorageModule.deleteTransaction(id)` and store the result in `transactions`
      - Call `Renderer.render(transactions)`
    - Confirm the event delegation listener in `init()` correctly targets the delete button via `e.target.closest('button[data-id]')` or `e.target.dataset.id` (update as needed so clicking 🗑 triggers `handleDelete`)
    - _Requirements: 3.2, 3.3, 4.3, 4.4, 5.3, 5.4_
    - **Verify:** Add two transactions. Click delete on the first — it disappears from the list, the balance updates, the chart will update (once chart is added). Reload the page — the deleted transaction is gone (was removed from localStorage).

- [x] 11. ChartModule
  - [x] 11.1 Implement ChartModule IIFE with `update()`
    - In `js/app.js`, write the `ChartModule` IIFE before `Renderer`:
      ```js
      const ChartModule = (function () {
        let chart = null;
        function update(transactions) { /* ... */ }
        return { update };
      })();
      ```
    - `update(transactions)`:
      - Get `canvas = document.getElementById('spending-chart')` and `placeholder = document.getElementById('chart-placeholder')`
      - If `typeof Chart === 'undefined'`, show the placeholder and return (graceful CDN failure)
      - Group transactions by category and sum amounts per category; keep only groups with a total greater than 0
      - If there are no valid groups (empty result):
        - If `chart` exists: `chart.destroy(); chart = null`
        - Show the placeholder; return
      - Otherwise, hide the placeholder
      - Build `labels` (category names) and `data` (summed amounts) arrays
      - If `chart` is `null`: create a new `Chart(canvas, { type: 'pie', data: { labels, datasets: [{data}] }, options: {...} })` and assign it to `chart`
      - If `chart` already exists: update `chart.data.labels = labels`, `chart.data.datasets[0].data = data`, then call `chart.update()` (avoids flickering)
    - Call `ChartModule.update(transactions)` at the end of `Renderer.render()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
    - **Verify:** Open in browser. Add a "Food" transaction — the pie chart appears with one segment. Add a "Transport" transaction — the chart updates smoothly to show two segments. Delete all transactions — the chart disappears and the placeholder text returns.

- [x] 12. Data Persistence Verification
  - [x] 12.1 Verify storage round-trip and graceful error handling
    - Confirm `AppController.init()` calls `StorageModule.load()` and passes the result to `Renderer.render()` (should already be the case from task 6.1)
    - In `StorageModule.load()`, ensure the try/catch covers both the `JSON.parse` call and the array type check — if `!Array.isArray(parsed)` return `[]`
    - In `StorageModule.save()`, ensure the try/catch logs `console.error` on failure (quota exceeded scenario)
    - _Requirements: 6.3, 6.4, 6.5_
    - **Verify:**
      1. Add two transactions. Reload the page — both transactions are still visible, balance and chart are correct.
      2. Open DevTools → Application → Local Storage. Manually set the key `expense_visualizer_transactions` to the string `"not valid json"`. Reload — the app starts with an empty list and no errors in the console.
      3. Set the key to `123` (a valid number, not an array). Reload — same result: empty list, no errors.

- [ ] 13. Responsive Layout
  - [x] 13.1 Add desktop two-column layout and mobile touch-target styles
    - In `css/style.css`, add a `@media (min-width: 768px)` block:
      - Change `.app-main` to `display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;`
      - Set `.list-section { grid-column: 1 / -1; }` so the transaction list spans both columns
    - Add a `@media (max-width: 767px)` block:
      - Set `input, select, button { min-height: 44px; }` for touch-friendly tap targets
    - _Requirements: 7.1, 7.2_
    - **Verify:**
      1. Open in browser at a narrow viewport (375px) — single-column layout, all controls are tall enough to tap comfortably.
      2. Widen to 900px — form and chart appear side by side; transaction list spans full width below.

- [ ] 14. Optional Feature A — Custom Categories
  - [~] 14.1 Implement CategoryModule IIFE
    - In `js/app.js`, write the `CategoryModule` IIFE before `AppController`:
      ```js
      const CategoryModule = (function () {
        const CAT_KEY = 'expense_visualizer_categories';
        const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
        function loadCategories() { /* ... */ }
        function addCategory(name) { /* ... */ }
        function populateDropdown(categories) { /* ... */ }
        return { loadCategories, addCategory, populateDropdown };
      })();
      ```
    - `loadCategories()`: load custom categories from localStorage (same safe parse pattern as StorageModule); return `[...DEFAULT_CATEGORIES, ...custom]` (deduplicated)
    - `addCategory(name)`: validate (non-empty after trim, max 50 chars, not already in the list); if invalid return `{ success: false, error: '...' }`; otherwise save to localStorage and return `{ success: true, categories: loadCategories() }`
    - `populateDropdown(categories)`: clear `#select-category` and rebuild all `<option>` elements (keep the disabled default option at the top)
    - Also update `Validator`'s `KNOWN_CATEGORIES` to read from `CategoryModule.loadCategories()` instead of a hardcoded array, so new categories are immediately valid
    - _Requirements: Optional A — A.1, A.2, A.3_
    - **Verify:** Call `CategoryModule.addCategory('Health')` from the console — returns `{ success: true }`. Call `CategoryModule.loadCategories()` — returns `['Food','Transport','Fun','Health']`.

  - [~] 14.2 Add the inline add-category form to HTML and wire it up
    - In `index.html`, inside `#transaction-form` below the category `<select>` field group, uncomment (or add) the add-category inline form:
      ```html
      <div class="field-group add-category-group">
        <label for="input-new-category">New Category</label>
        <input type="text" id="input-new-category" placeholder="e.g. Health" />
        <button type="button" id="btn-add-category">Add Category</button>
        <span class="field-error" id="error-new-category" aria-live="polite"></span>
      </div>
      ```
    - In `AppController.init()`, attach a `click` listener to `#btn-add-category`:
      - Read `#input-new-category` value
      - Call `CategoryModule.addCategory(name)`
      - If `success`: call `CategoryModule.populateDropdown(result.categories)`; clear the input and error span
      - If not: show the error in `#error-new-category`
    - In `init()`, replace the initial call to populate the dropdown with `CategoryModule.populateDropdown(CategoryModule.loadCategories())`
    - _Requirements: Optional A — A.1, A.2, A.3_
    - **Verify:** Open in browser. Type "Health" in the new category field and click "Add Category" — "Health" appears in the category dropdown. Reload the page — "Health" is still in the dropdown.

- [ ] 15. Optional Feature B — Transaction Sorting
  - [~] 15.1 Implement SortModule IIFE and sort controls
    - In `js/app.js`, write the `SortModule` IIFE before `Renderer`:
      ```js
      const SortModule = (function () {
        let currentKey = null;
        let currentDir = 'asc';
        function sort(transactions, key, dir) { /* ... */ }
        function getActive() { return { key: currentKey, dir: currentDir }; }
        function setActive(key, dir) { currentKey = key; currentDir = dir; }
        return { sort, getActive, setActive };
      })();
      ```
    - `sort(transactions, key, dir)`: returns a new array (never mutate the original); sort by `amount` (numeric) or `category` (alphabetical); respect `dir` (`'asc'` or `'desc'`)
    - In `index.html`, uncomment (or add) the sort controls above `<ul id="transaction-list">`:
      ```html
      <div class="sort-controls">
        <button type="button" data-sort="amount-asc">Amount ↑</button>
        <button type="button" data-sort="amount-desc">Amount ↓</button>
        <button type="button" data-sort="category-asc">Category A–Z</button>
      </div>
      ```
    - In `AppController.init()`, attach a `click` listener to `.sort-controls`:
      - Parse `e.target.dataset.sort` into `key` and `dir`
      - Call `SortModule.setActive(key, dir)`
      - Call `Renderer.render(transactions)`
    - In `Renderer.render()`, before building the list, check `SortModule.getActive()`; if a sort is active, apply `SortModule.sort(sorted, key, dir)` to the display copy (do not touch the stored array)
    - _Requirements: Optional B — B.1, B.2, B.3_
    - **Verify:** Add three transactions in different categories and amounts. Click "Amount ↑" — list reorders cheapest first. Click "Category A–Z" — list reorders alphabetically. Add a new transaction — it appears in the correct sorted position. Reload — sort preference resets (display-only, never persisted).

- [ ] 16. Optional Feature C — Dark/Light Mode
  - [~] 16.1 Implement ThemeModule IIFE and toggle button
    - In `js/app.js`, write the `ThemeModule` IIFE before `AppController`:
      ```js
      const ThemeModule = (function () {
        const THEME_KEY = 'expense_visualizer_theme';
        function init() { /* ... */ }
        function toggle() { /* ... */ }
        return { init, toggle };
      })();
      ```
    - `init()`: read `localStorage.getItem(THEME_KEY)`; if `'dark'` set `document.documentElement.setAttribute('data-theme', 'dark')`; otherwise set `'light'`
    - `toggle()`: read the current `data-theme` from `document.documentElement`; flip to the opposite; update the attribute; persist to `localStorage.setItem(THEME_KEY, newTheme)`; call `ChartModule.update(transactions)` so the chart redraws with updated colors
    - In `index.html` inside `<header>`, uncomment (or add) `<button id="theme-toggle" aria-label="Toggle dark mode">🌙</button>`
    - In `AppController.init()`, call `ThemeModule.init()` and attach a `click` listener to `#theme-toggle` that calls `ThemeModule.toggle()`
    - In `css/style.css`, add dark mode overrides under `[data-theme="dark"]` using the dark-mode custom property values from the design document
    - _Requirements: Optional C — C.1, C.2, C.3_
    - **Verify:** Open in browser. Click the 🌙 button — the whole page switches to dark colors. Reload — dark mode is still active. Click again — light mode is restored.

---

## Notes

- Tasks 1–13 cover all required features. Tasks 14–16 are optional enhancements.
- Each task is verified manually by opening `index.html` directly in a browser — no server or build step needed.
- DevTools console (F12) is used for storage and module verification in the early tasks.
- The IIFE order in `app.js` must be: `StorageModule` → `Validator` → `ChartModule` → `Renderer` → `CategoryModule` (optional) → `SortModule` (optional) → `ThemeModule` (optional) → `AppController`, with the `DOMContentLoaded` listener at the very bottom.
- Never mutate the stored transactions array for display purposes (sorting, filtering) — always work on a copy.
- Amount formatting should be consistent throughout: choose one format (e.g. Indonesian Rupiah style) and use it everywhere.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["11.1"] },
    { "id": 11, "tasks": ["12.1"] },
    { "id": 12, "tasks": ["13.1"] },
    { "id": 13, "tasks": ["14.1"] },
    { "id": 14, "tasks": ["14.2"] },
    { "id": 15, "tasks": ["15.1"] },
    { "id": 16, "tasks": ["16.1"] }
  ]
}
```
