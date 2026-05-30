import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { uid } from '../utils/format.js';
import BottomSheet from '../components/BottomSheet.jsx';

const BANK_COLORS = ['#6C63FF', '#00C9A7', '#FFB830', '#FF6B6B', '#A78BFA', '#FF6B9D', '#FF8C42'];
const BANK_EMOJIS = ['🏦', '💳', '🏧', '💰', '🪙', '🏛️', '💎'];

const EMPTY_BANK = { name: '', emoji: '🏦', color: '#6C63FF' };
const EMPTY_DEBT = { name: '', totalAmount: '', notes: '' };

export default function Banks() {
  const { banks, addBank, updateBank, deleteBank, debts, addDebt, updateDebt, deleteDebt, fmt } = useApp();

  const [bankSheet, setBankSheet] = useState(false);
  const [editBank, setEditBank] = useState(null);
  const [bankForm, setBankForm] = useState(EMPTY_BANK);

  const [accountSheet, setAccountSheet] = useState(false);
  const [targetBank, setTargetBank] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [editAccountId, setEditAccountId] = useState(null);

  const [debtSheet, setDebtSheet] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT);

  const [paySheet, setPaySheet] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Bank handlers
  function openAddBank() { setEditBank(null); setBankForm(EMPTY_BANK); setBankSheet(true); }
  function openEditBank(b) { setEditBank(b); setBankForm({ name: b.name, emoji: b.emoji, color: b.color }); setBankSheet(true); }

  async function handleSaveBank() {
    if (!bankForm.name.trim()) return;
    if (editBank) {
      await updateBank({ ...editBank, ...bankForm });
    } else {
      await addBank(bankForm);
    }
    setBankSheet(false);
  }

  async function handleDeleteBank() {
    await deleteBank(editBank.id);
    setBankSheet(false);
  }

  // Account handlers
  function openAddAccount(bank) { setTargetBank(bank); setAccountName(''); setEditAccountId(null); setAccountSheet(true); }
  function openEditAccount(bank, acc) { setTargetBank(bank); setAccountName(acc.name); setEditAccountId(acc.id); setAccountSheet(true); }

  async function handleSaveAccount() {
    if (!accountName.trim() || !targetBank) return;
    const accounts = editAccountId
      ? targetBank.accounts.map(a => a.id === editAccountId ? { ...a, name: accountName } : a)
      : [...(targetBank.accounts || []), { id: uid(), name: accountName }];
    await updateBank({ ...targetBank, accounts });
    setAccountSheet(false);
  }

  async function handleDeleteAccount() {
    const accounts = targetBank.accounts.filter(a => a.id !== editAccountId);
    await updateBank({ ...targetBank, accounts });
    setAccountSheet(false);
  }

  // Debt handlers
  function openAddDebt() { setEditDebt(null); setDebtForm(EMPTY_DEBT); setDebtSheet(true); }
  function openEditDebt(d) { setEditDebt(d); setDebtForm({ name: d.name, totalAmount: String(d.totalAmount), notes: d.notes || '' }); setDebtSheet(true); }

  async function handleSaveDebt() {
    if (!debtForm.name.trim() || !debtForm.totalAmount) return;
    const data = { ...debtForm, totalAmount: Number(debtForm.totalAmount) };
    if (editDebt) {
      await updateDebt({ ...editDebt, ...data });
    } else {
      await addDebt(data);
    }
    setDebtSheet(false);
  }

  async function handleDeleteDebt() {
    await deleteDebt(editDebt.id);
    setDebtSheet(false);
  }

  // Pay debt
  function openPayDebt(d) { setPayTarget(d); setPayAmount(''); setPaySheet(true); }
  async function handlePayDebt() {
    if (!payAmount || !payTarget) return;
    const newPaid = Math.min(payTarget.totalAmount, (payTarget.paidAmount || 0) + Number(payAmount));
    await updateDebt({ ...payTarget, paidAmount: newPaid, paid: newPaid >= payTarget.totalAmount });
    setPaySheet(false);
  }

  const activeDebts = debts.filter(d => !d.paid);
  const paidDebts = debts.filter(d => d.paid);

  return (
    <div className="page">
      <div style={{ padding: '52px 16px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>بنوكي</h1>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{banks.length} بنك</span>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Banks Section */}
        <section>
          <div className="section-header">
            <span className="section-title">🏦 البنوك والحسابات</span>
            <button className="section-action" onClick={openAddBank}>+ إضافة</button>
          </div>

          {banks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
              <div>أضف بنكك الأول</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {banks.map(bank => (
              <div key={bank.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: bank.accounts?.length ? 12 : 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: bank.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>{bank.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{bank.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{bank.accounts?.length || 0} حساب</div>
                  </div>
                  <button className="btn-icon" onClick={() => openEditBank(bank)} style={{ color: 'var(--text2)' }}>✎</button>
                </div>

                {/* Accounts */}
                {(bank.accounts || []).map(acc => (
                  <div key={acc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: bank.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{acc.name}</span>
                    <button className="btn-icon" onClick={() => openEditAccount(bank, acc)}
                      style={{ width: 28, height: 28, fontSize: 12, color: 'var(--text3)' }}>✎</button>
                  </div>
                ))}

                <button onClick={() => openAddAccount(bank)} style={{
                  background: 'none', border: '1.5px dashed var(--border)', borderRadius: 10,
                  color: 'var(--text3)', cursor: 'pointer', padding: '8px', width: '100%',
                  fontSize: 13, fontFamily: 'Mestika, Cairo, sans-serif',
                }}>+ إضافة حساب</button>
              </div>
            ))}
          </div>
        </section>

        {/* Debts Section */}
        <section>
          <div className="section-header">
            <span className="section-title">💳 الديون</span>
            <button className="section-action" onClick={openAddDebt}>+ إضافة</button>
          </div>

          {debts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14 }}>لا ديون — رائع!</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeDebts.map(d => {
              const pct = d.totalAmount > 0 ? Math.min(100, ((d.paidAmount || 0) / d.totalAmount) * 100) : 0;
              return (
                <div key={d.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: 'var(--danger-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    }}>💳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {fmt(d.paidAmount || 0)} / {fmt(d.totalAmount)} ريال
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" onClick={() => openPayDebt(d)}
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 14 }}>+</button>
                      <button className="btn-icon" onClick={() => openEditDebt(d)} style={{ color: 'var(--text2)', fontSize: 12 }}>✎</button>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--accent)' : 'var(--danger)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, textAlign: 'left' }}>{pct.toFixed(0)}%</div>
                </div>
              );
            })}

            {paidDebts.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>✅ مسدّدة</div>
                {paidDebts.map(d => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    background: 'var(--accent-dim)', borderRadius: 'var(--r)', marginBottom: 8, opacity: 0.7,
                  }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <span style={{ flex: 1, textDecoration: 'line-through', color: 'var(--text2)', fontSize: 14 }}>{d.name}</span>
                    <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{fmt(d.totalAmount)} ريال</span>
                    <button className="btn-icon" onClick={() => openEditDebt(d)} style={{ color: 'var(--text3)', fontSize: 12, width: 28, height: 28 }}>✎</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Bank Sheet */}
      <BottomSheet open={bankSheet} onClose={() => setBankSheet(false)} title={editBank ? 'تعديل البنك' : 'إضافة بنك'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">اسم البنك</label>
            <input className="input" placeholder="مثال: البنك الأهلي" value={bankForm.name}
              onChange={e => setBankForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">الأيقونة</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BANK_EMOJIS.map(em => (
                <button key={em} onClick={() => setBankForm(p => ({ ...p, emoji: em }))} style={{
                  width: 44, height: 44, borderRadius: 10, fontSize: 22, border: 'none', cursor: 'pointer',
                  background: bankForm.emoji === em ? 'var(--primary)' : 'var(--card2)',
                }}>{em}</button>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">اللون</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BANK_COLORS.map(col => (
                <button key={col} onClick={() => setBankForm(p => ({ ...p, color: col }))} style={{
                  width: 32, height: 32, borderRadius: '50%', border: bankForm.color === col ? '3px solid white' : 'none',
                  cursor: 'pointer', background: col,
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            {editBank && (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteBank}>حذف</button>
            )}
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveBank}>
              {editBank ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Account Sheet */}
      <BottomSheet open={accountSheet} onClose={() => setAccountSheet(false)} title={editAccountId ? 'تعديل الحساب' : 'إضافة حساب'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">اسم الحساب</label>
            <input className="input" placeholder="مثال: الحساب الراتب" value={accountName}
              onChange={e => setAccountName(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            {editAccountId && (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteAccount}>حذف</button>
            )}
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveAccount}>
              {editAccountId ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Debt Sheet */}
      <BottomSheet open={debtSheet} onClose={() => setDebtSheet(false)} title={editDebt ? 'تعديل الدين' : 'إضافة دين'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">اسم الدين / الجهة</label>
            <input className="input" placeholder="مثال: قرض السيارة" value={debtForm.name}
              onChange={e => setDebtForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">المبلغ الإجمالي (ريال)</label>
            <input className="input" type="number" inputMode="numeric" placeholder="0"
              value={debtForm.totalAmount} onChange={e => setDebtForm(p => ({ ...p, totalAmount: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">ملاحظات (اختياري)</label>
            <input className="input" placeholder="..." value={debtForm.notes}
              onChange={e => setDebtForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
            {editDebt && (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteDebt}>حذف</button>
            )}
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveDebt}>
              {editDebt ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Pay Debt Sheet */}
      <BottomSheet open={paySheet} onClose={() => setPaySheet(false)} title="تسجيل سداد">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {payTarget && (
            <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{payTarget.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                متبقي: {fmt((payTarget.totalAmount || 0) - (payTarget.paidAmount || 0))} ريال
              </div>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">المبلغ المدفوع (ريال)</label>
            <input className="input" type="number" inputMode="numeric" placeholder="0"
              value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ paddingBottom: 8 }} onClick={handlePayDebt}>تأكيد السداد</button>
        </div>
      </BottomSheet>
    </div>
  );
}
