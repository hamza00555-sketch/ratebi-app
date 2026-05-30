import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatAmount } from '../utils/format.js';
import * as db from '../db/index.js';
import { hashPin, verifyPin } from '../utils/notifications.js';

export default function Settings() {
  const { settings, updateSettings, setPage, privacyMode } = useApp();
  const [salary, setSalary] = useState(String(settings.salary));
  const [salaryDay, setSalaryDay] = useState(settings.salaryDay);
  const [expenseBudget, setExpenseBudget] = useState(String(settings.expenseBudget || ''));
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');

  // PIN state
  const [pinStep, setPinStep] = useState('idle'); // 'idle' | 'set' | 'confirm' | 'disable'
  const [pinInput, setPinInput] = useState('');
  const [pinFirst, setPinFirst] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  async function handleSave() {
    await updateSettings({
      salary: Number(salary),
      salaryDay,
      expenseBudget: Number(expenseBudget),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // PIN handlers
  async function handlePinInput(digit) {
    const next = pinInput + digit;
    if (next.length > 4) return;
    setPinInput(next);
    setPinError('');
    if (next.length === 4) {
      setTimeout(() => processPinEntry(next), 150);
    }
  }

  async function processPinEntry(val) {
    if (pinStep === 'set') {
      setPinFirst(val);
      setPinInput('');
      setPinStep('confirm');
    } else if (pinStep === 'confirm') {
      if (val === pinFirst) {
        const hash = await hashPin(val);
        await updateSettings({ pinEnabled: true, pinHash: hash });
        setPinStep('idle');
        setPinInput('');
        setPinFirst('');
        setPinSaved(true);
        setTimeout(() => setPinSaved(false), 2000);
      } else {
        setPinError('الرمزان غير متطابقان');
        setPinInput('');
        setPinFirst('');
        setPinStep('set');
      }
    } else if (pinStep === 'disable') {
      const ok = await verifyPin(val, settings.pinHash);
      if (ok) {
        await updateSettings({ pinEnabled: false, pinHash: null });
        setPinStep('idle');
        setPinInput('');
      } else {
        setPinError('رمز خاطئ');
        setPinInput('');
      }
    }
  }

  async function handleExport() {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ratebi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importAll(data);
      window.location.reload();
    } catch {
      setImportError('الملف غير صالح أو تالف');
    }
    e.target.value = '';
  }

  async function handleResetSalaryDay() {
    setPage('salaryDay');
  }

  const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="page">
      <div style={{ padding: '52px 16px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>الإعدادات</h1>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Salary Settings */}
        <section>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>💰 إعدادات الراتب</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">الراتب الشهري (ريال)</label>
              <input className="input" type="number" inputMode="numeric"
                value={salary} onChange={e => setSalary(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">ميزانية المصروف الشهري (ريال)</label>
              <input className="input" type="number" inputMode="numeric"
                value={expenseBudget} onChange={e => setExpenseBudget(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">يوم نزول الراتب</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DAYS.map(d => (
                  <button key={d} onClick={() => setSalaryDay(d)} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 13,
                    background: salaryDay === d ? 'var(--primary)' : 'var(--card2)',
                    color: salaryDay === d ? '#fff' : 'var(--text2)',
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
            </button>
          </div>
        </section>

        {/* Salary Day */}
        <section>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginBottom: 12 }}>📅 يوم الراتب</div>
          <div className="card">
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14 }}>
              فتح شاشة توزيع الراتب مجدداً لهذا الشهر
            </p>
            <button className="btn btn-outline" onClick={handleResetSalaryDay}>
              فتح شاشة يوم الراتب
            </button>
          </div>
        </section>

        {/* Backup */}
        <section>
          <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700, marginBottom: 12 }}>💾 البيانات والنسخ الاحتياطي</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{
                flex: 1, background: 'var(--accent-dim)', color: 'var(--accent)',
                borderRadius: 10, padding: '12px',
              }} onClick={handleExport}>
                ⬆️ تصدير نسخة
              </button>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 10,
                padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 15,
              }}>
                ⬇️ استيراد نسخة
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </div>
            {importError && (
              <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{importError}</div>
            )}
            <p style={{ color: 'var(--text3)', fontSize: 12 }}>
              جميع البيانات محفوظة محلياً على جهازك فقط
            </p>
          </div>
        </section>

        {/* PIN & Privacy */}
        <section>
          <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginBottom: 12 }}>🔐 الأمان والخصوصية</div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Privacy Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>وضع الخصوصية</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>إخفاء الأرقام في التطبيق</div>
              </div>
              <button onClick={() => updateSettings({ privacyMode: !privacyMode })} style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: privacyMode ? 'var(--primary)' : 'var(--card2)',
                position: 'relative', transition: 'background .2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                  background: '#fff', transition: 'right .2s',
                  right: privacyMode ? 3 : 27,
                }} />
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* PIN Section */}
            {pinStep === 'idle' ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" style={{
                  flex: 1, background: settings.pinEnabled ? 'var(--danger-dim)' : 'var(--primary-dim)',
                  color: settings.pinEnabled ? 'var(--danger)' : 'var(--primary)',
                  borderRadius: 10, padding: '12px',
                }} onClick={() => { setPinStep(settings.pinEnabled ? 'disable' : 'set'); setPinInput(''); setPinError(''); }}>
                  {settings.pinEnabled ? '🔓 تعطيل الـ PIN' : '🔒 تفعيل الـ PIN'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                  {pinStep === 'set' ? 'أدخل رمز PIN جديد' : pinStep === 'confirm' ? 'أعد إدخال الرمز للتأكيد' : 'أدخل رمز PIN الحالي للتعطيل'}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      width: 48, height: 56, borderRadius: 10,
                      border: `2px solid ${pinInput.length > i ? 'var(--primary)' : 'var(--border)'}`,
                      background: pinInput.length > i ? 'var(--primary-dim)' : 'var(--card2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {pinInput.length > i && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
                    </div>
                  ))}
                </div>
                {pinError && <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{pinError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, maxWidth: 240, margin: '0 auto' }}>
                  {['1','2','3','4','5','6','7','8','9','','0','del'].map((k, i) => (
                    k === '' ? <div key={i} /> :
                    <button key={i} onClick={() => k === 'del' ? setPinInput(p => p.slice(0,-1)) : handlePinInput(k)} style={{
                      height: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: k === 'del' ? 'transparent' : 'var(--card2)',
                      color: 'var(--text)', fontSize: k === 'del' ? 18 : 20, fontWeight: 700,
                      fontFamily: 'Cairo, sans-serif',
                    }}>{k === 'del' ? '⌫' : k}</button>
                  ))}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 12, width: '100%' }}
                  onClick={() => { setPinStep('idle'); setPinInput(''); setPinFirst(''); setPinError(''); }}>
                  إلغاء
                </button>
              </div>
            )}
            {pinSaved && <div style={{ color: 'var(--accent)', fontSize: 13, textAlign: 'center' }}>✓ تم حفظ الـ PIN بنجاح</div>}
          </div>
        </section>

        {/* App Info */}
        <section>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💼</div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>راتبي</div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>الإصدار 2.0 · أوفلاين كامل</div>
          </div>
        </section>
      </div>
    </div>
  );
}
