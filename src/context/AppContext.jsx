import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../db/index.js';
import { currentMonth, uid, todayISO, monthFromDate } from '../utils/format.js';
import { calcGoalMonthly } from '../utils/calc.js';
import { verifyPin, hashPin } from '../utils/notifications.js';
import { formatAmount } from '../utils/format.js';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const DEFAULT_SETTINGS = {
  salary: 0, salaryDay: 25, currency: 'ريال',
  onboardingComplete: false, expenseBudget: 1500,
  pinEnabled: false, pinHash: null, privacyMode: false,
};

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [commitments, setCommitments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [banks, setBanks] = useState([]);
  const [debts, setDebts] = useState([]);
  const [extraIncome, setExtraIncome] = useState([]);
  const [page, setPage] = useState('loading');
  const [locked, setLocked] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [s, c, g, e, mr, b, d, ei] = await Promise.all([
      db.getAllSettings(),
      db.getCommitments(),
      db.getGoals(),
      db.getExpenses(),
      db.getMonthlyRecords(),
      db.getBanks(),
      db.getDebts(),
      db.getExtraIncome(),
    ]);
    const merged = { ...DEFAULT_SETTINGS, ...s };
    setSettings(merged);
    setCommitments(c);
    setGoals(g);
    setExpenses(e);
    setMonthlyRecords(mr);
    setBanks(b);
    setDebts(d);
    setExtraIncome(ei);
    setPrivacyMode(!!merged.privacyMode);

    if (merged.pinEnabled && merged.pinHash) setLocked(true);

    if (!merged.onboardingComplete) {
      setPage('onboarding');
    } else {
      const month = currentMonth();
      const hasRecord = mr.some(r => r.month === month);
      const today = new Date().getDate();
      if (!hasRecord && today >= merged.salaryDay) {
        setPage('salaryDay');
      } else {
        setPage('dashboard');
      }
    }
    setLoading(false);
  }

  const fmt = useCallback((n) => {
    return privacyMode ? '••••' : formatAmount(n);
  }, [privacyMode]);

  const togglePrivacy = useCallback(() => {
    setPrivacyMode(prev => !prev);
  }, []);

  const unlock = useCallback(async (pin) => {
    const s = await db.getAllSettings();
    const merged = { ...DEFAULT_SETTINGS, ...s };
    if (!merged.pinHash) { setLocked(false); return true; }
    const ok = await verifyPin(pin, merged.pinHash);
    if (ok) setLocked(false);
    return ok;
  }, []);

  const updateSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    if ('privacyMode' in updates) setPrivacyMode(!!updates.privacyMode);
    for (const [k, v] of Object.entries(updates)) await db.setSetting(k, v);
  }, [settings]);

  // Commitments
  const addCommitment = useCallback(async (data) => {
    const item = { id: uid(), active: true, ...data };
    await db.saveCommitment(item);
    setCommitments(prev => [...prev, item]);
    return item;
  }, []);

  const updateCommitment = useCallback(async (item) => {
    await db.saveCommitment(item);
    setCommitments(prev => prev.map(c => c.id === item.id ? item : c));
  }, []);

  const deleteCommitment = useCallback(async (id) => {
    await db.deleteCommitment(id);
    setCommitments(prev => prev.filter(c => c.id !== id));
  }, []);

  // Goals
  const addGoal = useCallback(async (data) => {
    const item = { id: uid(), savedAmount: 0, completed: false, ...data };
    item.monthlyContribution = data.monthlyContribution ?? calcGoalMonthly(item);
    await db.saveGoal(item);
    setGoals(prev => [...prev, item]);
    return item;
  }, []);

  const updateGoal = useCallback(async (item) => {
    await db.saveGoal(item);
    setGoals(prev => prev.map(g => g.id === item.id ? item : g));
  }, []);

  const deleteGoal = useCallback(async (id) => {
    await db.deleteGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const addGoalAmount = useCallback(async (id, amount) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const updated = { ...goal, savedAmount: (goal.savedAmount || 0) + amount };
    if (updated.savedAmount >= updated.targetAmount) updated.completed = true;
    await db.saveGoal(updated);
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
  }, [goals]);

  // Expenses
  const addExpense = useCallback(async (data) => {
    const today = todayISO();
    const item = { id: uid(), date: today, month: monthFromDate(today), ...data };
    await db.saveExpense(item);
    setExpenses(prev => [...prev, item]);
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await db.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  // Banks
  const addBank = useCallback(async (data) => {
    const item = { id: uid(), accounts: [], ...data };
    await db.saveBank(item);
    setBanks(prev => [...prev, item]);
    return item;
  }, []);

  const updateBank = useCallback(async (item) => {
    await db.saveBank(item);
    setBanks(prev => prev.map(b => b.id === item.id ? item : b));
  }, []);

  const deleteBank = useCallback(async (id) => {
    await db.deleteBank(id);
    setBanks(prev => prev.filter(b => b.id !== id));
  }, []);

  // Debts
  const addDebt = useCallback(async (data) => {
    const item = { id: uid(), paidAmount: 0, paid: false, ...data };
    await db.saveDebt(item);
    setDebts(prev => [...prev, item]);
    return item;
  }, []);

  const updateDebt = useCallback(async (item) => {
    await db.saveDebt(item);
    setDebts(prev => prev.map(d => d.id === item.id ? item : d));
  }, []);

  const deleteDebt = useCallback(async (id) => {
    await db.deleteDebt(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  // Extra Income
  const addExtraIncome = useCallback(async (data) => {
    const item = { id: uid(), date: todayISO(), ...data };
    await db.saveExtraIncome(item);
    setExtraIncome(prev => [...prev, item]);
    return item;
  }, []);

  const deleteExtraIncome = useCallback(async (id) => {
    await db.deleteExtraIncomeById(id);
    setExtraIncome(prev => prev.filter(e => e.id !== id));
  }, []);

  const confirmSalaryDay = useCallback(async (record) => {
    await db.saveMonthlyRecord(record);
    setMonthlyRecords(prev => {
      const exists = prev.find(r => r.month === record.month);
      return exists ? prev.map(r => r.month === record.month ? record : r) : [...prev, record];
    });
    setPage('dashboard');
  }, []);

  const currentMonthRecord = monthlyRecords.find(r => r.month === currentMonth()) || null;

  return (
    <AppContext.Provider value={{
      loading, settings, commitments, goals, expenses, monthlyRecords,
      banks, debts, extraIncome,
      page, setPage, currentMonthRecord,
      locked, unlock,
      privacyMode, togglePrivacy, fmt,
      updateSettings,
      addCommitment, updateCommitment, deleteCommitment,
      addGoal, updateGoal, deleteGoal, addGoalAmount,
      addExpense, deleteExpense,
      addBank, updateBank, deleteBank,
      addDebt, updateDebt, deleteDebt,
      addExtraIncome, deleteExtraIncome,
      confirmSalaryDay,
    }}>
      {children}
    </AppContext.Provider>
  );
}
