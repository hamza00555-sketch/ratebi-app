import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatAmount, todayISO } from '../utils/format.js';
import BottomSheet from '../components/BottomSheet.jsx';

const SOURCES = [
  { id: 'freelance', label: 'فريلانس', emoji: '💻' },
  { id: 'sell', label: 'بيع', emoji: '🛍️' },
  { id: 'gift', label: 'هدية', emoji: '🎁' },
  { id: 'bonus', label: 'مكافأة', emoji: '⭐' },
  { id: 'other', label: 'أخرى', emoji: '📌' },
];

const EMPTY_FORM = { amount: '', source: 'freelance', notes: '', date: todayISO() };

export default function ExtraIncomeSheet({ open, onClose }) {
  const { extraIncome, addExtraIncome, deleteExtraIncome, fmt, goals, debts } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState('add'); // 'add' | 'history'
  const [confirmDel, setConfirmDel] = useState(null);

  const totalExtra = extraIncome.reduce((s, e) => s + (e.amount || 0), 0);

  async function handleSave() {
    if (!form.amount) return;
    await addExtraIncome({ ...form, amount: Number(form.amount) });
    setForm({ ...EMPTY_FORM, date: todayISO() });
    setTab('history');
  }

  function getSourceData(id) {
    return SOURCES.find(s => s.id === id) || SOURCES[SOURCES.length - 1];
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="الدخل الإضافي">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['add', '+ تسجيل'], ['history', 'السجل']].map(([id, label]) => (
          <button key={id} className={`chip chip-ghost ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, alignSelf: 'center' }}>
          {fmt(totalExtra)} ريال
        </div>
      </div>

      {tab === 'add' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">المبلغ (ريال)</label>
            <input className="input" type="number" inputMode="numeric" placeholder="0"
              value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>

          <div className="input-group">
            <label className="input-label">المصدر</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SOURCES.map(s => (
                <button key={s.id} className={`chip chip-ghost ${form.source === s.id ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, source: s.id }))}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">ملاحظات (اختياري)</label>
            <input className="input" placeholder="تفاصيل إضافية..." value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="input-group">
            <label className="input-label">التاريخ</label>
            <input className="input" type="date" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>

          <button className="btn btn-primary" style={{ paddingBottom: 8 }} onClick={handleSave}>
            تسجيل الدخل الإضافي
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {extraIncome.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
              <div>لا يوجد دخل إضافي مسجّل</div>
            </div>
          )}
          {[...extraIncome].reverse().map(item => {
            const src = getSourceData(item.source);
            return (
              <div key={item.id} className="list-item">
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>{src.emoji}</div>
                <div className="list-item-info">
                  <div className="list-item-name">{src.label}</div>
                  <div className="list-item-sub">{item.notes || item.date}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                    +{fmt(item.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>ريال</div>
                </div>
                <button className="btn-icon" onClick={() => setConfirmDel(item)}
                  style={{ color: 'var(--danger)', fontSize: 16, background: 'var(--danger-dim)', marginRight: 4 }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>حذف {formatAmount(confirmDel.amount)} ريال؟</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>إلغاء</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => {
                await deleteExtraIncome(confirmDel.id);
                setConfirmDel(null);
              }}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
