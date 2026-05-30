import { openDB } from 'idb';

const DB_NAME = 'ratebi-db';
const DB_VERSION = 3;

let _db;
async function db() {
  if (!_db) {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          database.createObjectStore('settings', { keyPath: 'key' });
          database.createObjectStore('commitments', { keyPath: 'id' });
          database.createObjectStore('goals', { keyPath: 'id' });
          const expenses = database.createObjectStore('expenses', { keyPath: 'id' });
          expenses.createIndex('month', 'month');
          database.createObjectStore('monthlyRecords', { keyPath: 'month' });
        }
        if (oldVersion < 3) {
          database.createObjectStore('banks', { keyPath: 'id' });
          database.createObjectStore('debts', { keyPath: 'id' });
          database.createObjectStore('extraIncome', { keyPath: 'id' });
        }
      },
    });
  }
  return _db;
}

// Settings
export async function getSetting(key) {
  const r = await (await db()).get('settings', key);
  return r ? r.value : null;
}
export async function setSetting(key, value) {
  await (await db()).put('settings', { key, value });
}
export async function getAllSettings() {
  const all = await (await db()).getAll('settings');
  return all.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
}

// Commitments
export async function getCommitments() { return (await db()).getAll('commitments'); }
export async function saveCommitment(c) { await (await db()).put('commitments', c); }
export async function deleteCommitment(id) { await (await db()).delete('commitments', id); }

// Goals
export async function getGoals() { return (await db()).getAll('goals'); }
export async function saveGoal(g) { await (await db()).put('goals', g); }
export async function deleteGoal(id) { await (await db()).delete('goals', id); }

// Expenses
export async function getExpenses() { return (await db()).getAll('expenses'); }
export async function getExpensesByMonth(month) {
  return (await db()).getAllFromIndex('expenses', 'month', month);
}
export async function saveExpense(e) { await (await db()).put('expenses', e); }
export async function deleteExpense(id) { await (await db()).delete('expenses', id); }

// Monthly Records
export async function getMonthlyRecords() { return (await db()).getAll('monthlyRecords'); }
export async function saveMonthlyRecord(r) { await (await db()).put('monthlyRecords', r); }

// Banks
export async function getBanks() { return (await db()).getAll('banks'); }
export async function saveBank(b) { await (await db()).put('banks', b); }
export async function deleteBank(id) { await (await db()).delete('banks', id); }

// Debts
export async function getDebts() { return (await db()).getAll('debts'); }
export async function saveDebt(d) { await (await db()).put('debts', d); }
export async function deleteDebt(id) { await (await db()).delete('debts', id); }

// Extra Income
export async function getExtraIncome() { return (await db()).getAll('extraIncome'); }
export async function saveExtraIncome(e) { await (await db()).put('extraIncome', e); }
export async function deleteExtraIncomeById(id) { await (await db()).delete('extraIncome', id); }

// Export / Import
export async function exportAll() {
  const d = await db();
  const [settings, commitments, goals, expenses, monthlyRecords, banks, debts, extraIncome] = await Promise.all([
    d.getAll('settings'), d.getAll('commitments'), d.getAll('goals'),
    d.getAll('expenses'), d.getAll('monthlyRecords'),
    d.getAll('banks'), d.getAll('debts'), d.getAll('extraIncome'),
  ]);
  return { settings, commitments, goals, expenses, monthlyRecords, banks, debts, extraIncome, exportDate: new Date().toISOString() };
}

export async function importAll(data) {
  const d = await db();
  const stores = ['settings', 'commitments', 'goals', 'expenses', 'monthlyRecords', 'banks', 'debts', 'extraIncome'];
  const tx = d.transaction(stores, 'readwrite');
  for (const store of stores) await tx.objectStore(store).clear();
  for (const item of data.settings || []) await tx.objectStore('settings').put(item);
  for (const item of data.commitments || []) await tx.objectStore('commitments').put(item);
  for (const item of data.goals || []) await tx.objectStore('goals').put(item);
  for (const item of data.expenses || []) await tx.objectStore('expenses').put(item);
  for (const item of data.monthlyRecords || []) await tx.objectStore('monthlyRecords').put(item);
  for (const item of data.banks || []) await tx.objectStore('banks').put(item);
  for (const item of data.debts || []) await tx.objectStore('debts').put(item);
  for (const item of data.extraIncome || []) await tx.objectStore('extraIncome').put(item);
  await tx.done;
}
