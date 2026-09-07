export const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Each slot: { time, status: 'open' | 'group_joinable', groupSize?, joined?, remaining?, pricePerHead? }
export async function fetchAvailability(gym, date) {
  const res = await fetch(`${API_BASE}/api/availability?gym=${gym}&date=${date}`);
  if (!res.ok) throw new Error('Failed to load availability');
  const data = await res.json();
  return data.slots;
}

export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    const err = new Error('SLOT_TAKEN');
    err.code = 'SLOT_TAKEN';
    throw err;
  }
  if (res.status === 400) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'captcha verification failed' || data.error === 'captcha is required') {
      const err = new Error('CAPTCHA_FAILED');
      err.code = 'CAPTCHA_FAILED';
      throw err;
    }
  }
  if (!res.ok) throw new Error('Failed to create booking');
  return res.json();
}
