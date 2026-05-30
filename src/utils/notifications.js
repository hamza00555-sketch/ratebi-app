const SALT = 'ratebi-secure-salt-2024';

export async function hashPin(pin) {
  const data = new TextEncoder().encode(pin + SALT);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin, storedHash) {
  const h = await hashPin(pin);
  return h === storedHash;
}

export async function requestBiometric() {
  try {
    if (!window.PublicKeyCredential) return false;
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export function isBiometricAvailable() {
  return !!(window.PublicKeyCredential);
}
