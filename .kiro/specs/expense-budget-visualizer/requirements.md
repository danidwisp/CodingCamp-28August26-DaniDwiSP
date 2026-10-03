# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. Users can add transactions with a name, amount, and category; view a scrollable transaction history; see their total spending; and visualize spending distribution through a pie chart. The application runs entirely in the browser with no backend, persists data using the browser's Local Storage API, and is built with plain HTML, CSS, and Vanilla JavaScript.

---

## Glossary

- **Application**: The Expense & Budget Visualizer single-page web app.
- **Transaction**: A single spending record consisting of an item name, a monetary amount, and a category.
- **Transaction Form**: The HTML form through which a user enters a new Transaction.
- **Transaction List**: The scrollable UI section that displays all stored Transactions.
- **Category**: A label that classifies a Transaction (e.g., Food, Transport, Fun).
- **Total Balance**: The running sum of the amounts of all Transactions currently stored.
- **Pie Chart**: A circular chart rendered via Chart.js that shows spending distribution by Category.
- **Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Validator**: The client-side logic that checks Transaction Form inputs before submission.
- **Renderer**: The JavaScript logic responsible for updating the DOM after any data change.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category, so that I can record a new spending transaction.

#### Acceptance Criteria

1. THE Application SHALL render a Transaction Form containing an item name text field, an amount numeric field, and a category dropdown.
2. THE Transaction Form SHALL include exactly the default categories "Food", "Transport", and "Fun" as selectable options in the category dropdown, with no category pre-selected on initial render.
3. WHEN the user submits the Transaction Form, THE Validator SHALL verify that the item name field is not empty and contains between 1 and 100 characters.
4. WHEN the user submits the Transaction Form, THE Validator SHALL verify that the amount field contains a numeric value between 0.01 and 999,999,999.99.
5. WHEN the user submits the Transaction Form, THE Validator SHALL verify that a category has been selected from the category dropdown.
6. IF any required field is empty or invalid at submission time, THEN THE Validator SHALL display an inline error message adjacent to each invalid field indicating the validation rule that was violated, and SHALL NOT add a new Transaction.
7. WHEN all fields are valid and the form is submitted, THE Application SHALL add a new Transaction to the Transaction List.
8. WHEN all fields are valid and the form is submitted, THE Application SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to no selection.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Application SHALL render a Transaction List that displays all stored Transactions.
2. THE Renderer SHALL display the item name, amount (formatted to two decimal places with a currency symbol), and category for each Transaction in the Transaction List.
3. WHILE the number of Transactions exceeds the visible height of the Transaction List container, THE Application SHALL make the Transaction List scrollable.
4. THE Application SHALL display Transactions in the order they were added, with the most recently added Transaction appearing at the top of the Transaction List.
5. WHEN there are no Transactions stored, THE Application SHALL display an empty-state message in the Transaction List informing the user that no transactions have been added yet.

---

### Requirement 3: Delete Transaction

**User Story:** As a user, I want to delete individual transactions from the list, so that I can correct mistakes or remove unwanted entries.

#### Acceptance Criteria

1. THE Renderer SHALL render a delete button for each Transaction entry in the Transaction List.
2. WHEN the user clicks the delete button for a Transaction, THE Application SHALL remove that Transaction from Storage immediately without requiring a confirmation prompt.
3. WHEN a Transaction is deleted, THE Renderer SHALL immediately update the Transaction List, Total Balance, and Pie Chart to reflect the removal without requiring a page reload.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see the total amount of all my transactions at the top of the page, so that I always know my cumulative spending at a glance.

#### Acceptance Criteria

1. THE Application SHALL display the Total Balance above the Transaction List, visible without scrolling.
2. THE Renderer SHALL calculate the Total Balance as the sum of the amounts of all Transactions currently in Storage.
3. WHEN a new Transaction is added successfully, THE Renderer SHALL recalculate and update the Total Balance within 300ms.
4. WHEN a Transaction is deleted, THE Renderer SHALL recalculate and update the Total Balance within 300ms.
5. WHEN there are no Transactions, THE Application SHALL display a Total Balance of 0.

---

### Requirement 5: Pie Chart Visualization

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can quickly understand where my money is going.

#### Acceptance Criteria

1. THE Application SHALL render a Pie Chart showing each Category's share of the Total Balance.
2. THE Renderer SHALL group all Transactions by Category and calculate the sum of amounts per Category before rendering the Pie Chart.
3. WHEN a new Transaction is added, THE Renderer SHALL update the Pie Chart within 300ms to reflect the new spending distribution.
4. WHEN a Transaction is deleted, THE Renderer SHALL update the Pie Chart within 300ms to reflect the updated spending distribution.
5. WHEN there are no Transactions, THE Application SHALL display a text message in the chart area indicating no spending data is available.
6. THE Application SHALL render the Pie Chart using the Chart.js library.
7. THE Renderer SHALL exclude any Category whose total amount is zero or less from the Pie Chart segments.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my spending history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a new Transaction is successfully added, THE Application SHALL save the updated Transaction list to Storage under a fixed key.
2. WHEN a Transaction is deleted, THE Application SHALL save the updated Transaction list to Storage under the same fixed key.
3. WHEN the Application loads, THE Application SHALL read the Transaction list from Storage and restore all previously saved Transactions.
4. WHEN the Application loads and no data exists in Storage, THE Application SHALL initialize an empty Transaction list.
5. IF reading from Storage produces malformed or unparseable data, THEN THE Application SHALL initialize an empty Transaction list and SHALL NOT throw an unhandled error.

---

### Requirement 7: Responsive and Mobile-Friendly Layout

**User Story:** As a user on a mobile device, I want the application to be easy to read and use on a small screen, so that I can track expenses on the go.

#### Acceptance Criteria

1. THE Application SHALL use responsive CSS techniques so that the layout adapts to screen widths from 320px to 1440px without horizontal scrolling.
2. THE Application SHALL render all interactive controls (form inputs, buttons) at a touch-friendly tap target size of at least 44×44 CSS pixels on viewport widths ≤768px.
3. THE Application SHALL use a minimum body font size of 16px and maintain a text-to-background color contrast ratio of at least 4.5:1 (WCAG 2.1 AA) at all supported screen sizes.

---

### Requirement 8: Single-File Architecture Constraint

**User Story:** As a developer, I want the project to be organized with one CSS file and one JavaScript file, so that the codebase stays simple and easy to navigate.

#### Acceptance Criteria

1. THE Application SHALL contain exactly one CSS file inside the `css/` folder.
2. THE Application SHALL contain exactly one JavaScript file inside the `js/` folder.
3. THE Application SHALL load and run correctly in the latest two major versions of Chrome, Firefox, Safari, and Edge without requiring build tools or bundlers.

---

### Requirement 9: Performance

**User Story:** As a user, I want the application to feel instant when I add or delete transactions, so that the experience feels smooth and responsive.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE Renderer SHALL update the Transaction List, Total Balance, and Pie Chart within 100 milliseconds on a device with at least a dual-core CPU and 2 GB RAM.
2. THE Application SHALL load and become interactive within 3 seconds on a network connection of at least 10 Mbps download speed and 50ms round-trip latency.

---

## Optional / Nice-to-Have Requirements

### Optional Requirement A: Custom Categories

**User Story:** As a user, I want to add my own spending categories, so that I can better reflect my personal spending habits.

#### Acceptance Criteria

1. WHERE the custom-categories option is enabled, THE Application SHALL provide a UI control that allows the user to enter and save a new Category name.
2. WHERE the custom-categories option is enabled, WHEN a new Category is saved, THE Application SHALL add it to the category dropdown in the Transaction Form immediately.
3. WHERE the custom-categories option is enabled, THE Application SHALL persist custom Categories in Storage so they are available after a page reload.

---

### Optional Requirement B: Transaction Sorting

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can find patterns in my spending more easily.

#### Acceptance Criteria

1. WHERE the sorting option is enabled, THE Application SHALL provide controls to sort the Transaction List by amount in ascending or descending order.
2. WHERE the sorting option is enabled, THE Application SHALL provide a control to sort the Transaction List alphabetically by Category.
3. WHERE the sorting option is enabled, WHEN a sort order is selected, THE Renderer SHALL re-render the Transaction List in the chosen order immediately.

---

### Optional Requirement C: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between a dark and a light color scheme, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHERE the dark/light-mode option is enabled, THE Application SHALL render a toggle control that switches between dark mode and light mode.
2. WHERE the dark/light-mode option is enabled, WHEN the user activates the toggle, THE Application SHALL apply the selected color scheme to all UI elements immediately.
3. WHERE the dark/light-mode option is enabled, THE Application SHALL persist the user's color-scheme preference in Storage and restore it on the next page load.
