import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { currentMonth, currentMonthLabel, formatAmount, daysUntil } from '../utils/format.js';
import { calcSpent, calcCommitmentsTotal, calcGoalsMonthlyTotal } from '../utils/calc.js';
import { getCatData, COMMITMENT_CATEGORIES } from '../components/CategoryData.js';
import DonutChart from '../components/DonutChart.jsx';
import ExtraIncomeSheet from './ExtraIncomeSheet.jsx';

export default function Dashboard() {
  const { settings, commitments, goals, expenses, extraIncome, currentMonthRecord, setPage, fmt, togglePrivacy, privacyMode } = useApp();
  const [showExtraIncome, setShowExtraIncome] = useState(false);

  const month = currentMonth();
  const record = currentMonthRecord;

  const salary = record?.salary || settings.salary || 0;
  const commitmentsTotal = record?.commitmentsTotal || calcCommitmentsTotal(commitments);
  const goalsTotal = record?.goalsTotal || calcGoalsMonthlyTotal(goals);
  const expenseBudget = record?.expenseBudget || settings.expenseBudget || 0;
  const spent = useMemo(() => calcSpent(expenses, month), [expenses, month]);
  const totalExtra = useMemo(() => extraIncome.reduce((s, e) => s + (e.amount || 0), 0), [extraIncome]);
  const remaining = salary + totalExtra - commitmentsTotal - goalsTotal - spent;

  const segments = [
    { label: 'التزامات', value: commitmentsTotal, color: '#FF6B6B' },
    { label: 'أهداف', value: goalsTotal, color: '#FFB830' },
    { label: 'صرفت', value: spent, color: '#6C63FF' },
    { label: 'متبقي', value: Math.max(0, remaining), color: '#00C9A7' },
  ];

  const upcomingCommitments = commitments
    .filter(c => c.active !== false)
    .map(c => ({ ...c, days: daysUntil(c.dayOfMonth || 1) }))
    .filter(c => c.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  const budgetUsedPct = expenseBudget > 0 ? Math.min(100, (spent / expenseBudget) * 100) : 0;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ padding: '52px 16px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{currentMonthLabel()}</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>راتبي 💼</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={togglePrivacy} style={{
              background: 'var(--card2)', border: 'none', borderRadius: 10, width: 36, height: 36,
              cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{privacyMode ? '🙈' : '👁️'}</button>
            {record && (
              <div style={{ textAlign: 'left', background: 'var(--accent-dim)', borderRadius: 10, padding: '6px 12px' }}>
                <div style={{ fontSize: 11, color: 'var(--accent)' }}>الراتب</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{fmt(salary)} ريال</div>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <DonutChart segments={segments} size={160} strokeWidth={20}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>متبقي</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: remaining >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
              {fmt(Math.abs(remaining))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>ريال</div>
          </DonutChart>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {segments.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{formatAmount(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <StatCard label="صرفت هذا الشهر" value={spent} suffix="ريال" color="var(--primary)" icon="💸" fmt={fmt} />
          <StatCard label="التزامات الشهر" value={commitmentsTotal} suffix="ريال" color="var(--danger)" icon="📋" fmt={fmt} />
          <StatCard label="أهداف الشهر" value={goalsTotal} suffix="ريال" color="var(--gold)" icon="🎯" fmt={fmt} />
          <StatCard label="دخل إضافي" value={totalExtra} suffix="ريال" color="var(--accent)" icon="💰" fmt={fmt} onClick={() => setShowExtraIncome(true)} />
        </div>

        {/* Extra Income Banner */}
        {totalExtra > 0 && (
          <button onClick={() => setShowExtraIncome(true)} style={{
            background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--r)',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            width: '100%', fontFamily: 'Mestika, Cairo, sans-serif', textAlign: 'right',
          }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>دخل إضافي هذا الشهر</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>+{fmt(totalExtra)} ريال</div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 18 }}>←</span>
          </button>
        )}

        {/* Expense Budget Progress */}
        {expenseBudget > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700 }}>ميزانية المصروف</span>
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                {formatAmount(spent)} / {formatAmount(expenseBudget)} ريال
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${budgetUsedPct}%`,
                background: budgetUsedPct > 90 ? 'var(--danger)' : budgetUsedPct > 70 ? 'var(--gold)' : 'var(--accent)',
              }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text2)', textAlign: 'left' }}>
              {budgetUsedPct.toFixed(0)}% استُهلك
            </div>
          </div>
        )}

        {/* Upcoming Commitments */}
        {upcomingCommitments.length > 0 && (
          <div>
            <div className="section-header">
              <span className="section-title">التزامات قادمة ⏰</span>
              <button className="section-action" onClick={() => setPage('commitments')}>عرض الكل</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingCommitments.map(c => {
                const cat = getCatData(COMMITMENT_CATEGORIES, c.category);
                return (
                  <div key={c.id} className="list-item">
                    <div className="cat-icon" style={{ background: cat.bg }}>{cat.emoji}</div>
                    <div className="list-item-info">
                      <div className="list-item-name">{c.name}</div>
                      <div className="list-item-sub">
                        {c.days === 0 ? 'اليوم!' : c.days === 1 ? 'غداً' : `بعد ${c.days} أيام`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="list-item-amount" style={{ color: 'var(--danger)' }}>{formatAmount(c.amount)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>ريال</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No record notice */}
        {!record && (
          <div style={{
            background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: 'var(--r)',
            padding: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>لم تؤكد راتب هذا الشهر بعد</div>
            <button className="btn" style={{ background: 'var(--gold)', color: '#0D0A26', marginTop: 8, padding: '10px 20px', borderRadius: 10 }}
              onClick={() => setPage('salaryDay')}>
              ابدأ توزيع الراتب
            </button>
          </div>
        )}
      </div>

      {/* FAB — Extra Income */}
      <button className="fab" onClick={() => setShowExtraIncome(true)} style={{ bottom: 100 }}>💰</button>

      {/* Extra Income Sheet */}
      <ExtraIncomeSheet open={showExtraIncome} onClose={() => setShowExtraIncome(false)} />
    </div>
  );
}

function StatCard({ label, value, suffix, color, icon, fmt, onClick }) {
  return (
    <div className="card" style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color }}>{fmt ? fmt(value) : formatAmount(value)}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{suffix}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
