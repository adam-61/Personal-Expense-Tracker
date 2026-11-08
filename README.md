# Personal Expense Tracker

A simple, responsive web app for managing daily income and expenses. Add transactions, see your balance update instantly, and keep your data saved in the browser.

## Features

**Dashboard**
- Total Income, Total Expenses and Current Balance
- Current month's spending
- All figures update automatically when a transaction is added, edited or deleted

**Transactions**
- Add a transaction with a title, amount, type (Income or Expense), category and date
- View the full history in a table showing title, amount, category, type and date
- Delete any transaction, with a confirmation dialog first
- Edit an existing transaction
- Filter by All, Income or Expenses
- Search transactions by title

**Other**
- Data is saved with `localStorage`, so it is still there after a refresh or reopening the browser
- Form validation with inline error messages
- Success message after adding, updating or deleting a transaction
- Friendly message when there are no transactions
- Responsive layout for desktop, tablet and mobile
- "Load Sample Data" and "Clear All" buttons for quick demos

## Form Validation

- **Title**: required, up to 80 characters
- **Amount**: required, must be a number greater than 0
- **Type**: must be Income or Expense
- **Category**: required
- **Date**: required

## Categories

Food & Dining, Shopping, Salary, Transport, Housing & Utilities, Entertainment, Healthcare, Investments, Other

## How to Run

No installation is needed.

1. Download or clone this repository:
   ```bash
   git clone https://github.com/adam-61/Personal-Expense-Tracker
   ```
2. Open the project folder.
3. Double-click `index.html` to open it in any browser.

## Project Structure

```
.
├── index.html   # Page structure: dashboard, form, history table, delete dialog
├── style.css    # Styling and responsive layout
├── app.js       # App logic: state, validation, rendering, localStorage
└── README.md
```

## Technologies Used

- HTML5
- CSS (Grid, Flexbox, media queries)
- JavaScript
- Browser `localStorage` for data persistence

