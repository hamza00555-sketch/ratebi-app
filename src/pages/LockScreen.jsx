import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { requestBiometric, isBiometricAvailable } from '../utils/notifications.js';

export default function LockScreen() {
  const { unlock } = useApp();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvail, setBiometricAvail] = useState(false);

  useEffect(() => {
    setBiometricAvail(isBiometricAvailable());
    tryBiometric();
  }, []);

  useEffect(() => {
    if (pin.length === 4) verifyPin();
  }, [pin]);

  async function tryBiometric() {
    if (!isBiometricAvailable()) return;
    const ok = await requestBiometric();
    if (ok) await unlock('__biometric__');
  }

  async function verifyPin() {
    const ok = await unlock(pin);
    if (!ok) {
      setShake(true);
      setError('رمز خاطئ');
      setTimeout(() => { setShake(false); setError(''); setPin(''); }, 700);
    }
  }

  function pressKey(key) {
    if (pin.length >= 4) return;
    setPin(prev => prev + key);
  }

  function deleteLast() {
    setPin(prev => prev.slice(0, -1));
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '60px 24px 40px', zIndex: 999,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>💼</div>
        <div style={{ fontSize: 24, fontWeight: 900 }}>راتبي</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>أدخل رمز القفل</div>
      </div>

      {/* PIN Boxes */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div
          style={{ display: 'flex', gap: 12, animation: shake ? 'shake .4s ease' : 'none' }}
        >
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 60, height: 72, borderRadius: 14,
              border: `2px solid ${pin.length > i ? 'var(--primary)' : 'var(--border)'}`,
              background: pin.length > i ? 'var(--primary-dim)' : 'var(--card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}>
              {pin.length > i && (
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </div>
          ))}
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>{error}</div>}
      </div>

      {/* Numpad */}
      <div style={{ width: '100%', maxWidth: 300 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {KEYS.map((key, i) => {
            if (key === '') return <div key={i} />;
            const isDel = key === 'del';
            const isBio = key === '' && biometricAvail;
            return (
              <button
                key={i}
                onClick={() => isDel ? deleteLast() : pressKey(key)}
                style={{
                  height: 70, borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: isDel ? 'transparent' : 'rgba(255,255,255,0.06)',
                  color: 'var(--text)', fontSize: isDel ? 22 : 26, fontWeight: 700,
                  fontFamily: 'Cairo, sans-serif', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  transition: 'background .1s', backdropFilter: 'blur(4px)',
                }}
                onTouchStart={e => e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.12)'}
                onTouchEnd={e => e.currentTarget.style.background = isDel ? 'transparent' : 'rgba(255,255,255,0.06)'}
              >
                {isDel ? '⌫' : key}
              </button>
            );
          })}
        </div>

        {biometricAvail && (
          <button onClick={tryBiometric} style={{
            width: '100%', marginTop: 16, padding: '14px', borderRadius: 14, border: 'none',
            background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', cursor: 'pointer',
            fontSize: 14, fontFamily: 'Mestika, Cairo, sans-serif', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 22 }}>🔐</span> تسجيل بالبصمة / Face ID
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
