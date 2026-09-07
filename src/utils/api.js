export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const BOOKING_BOT_USERNAME = import.meta.env.VITE_BOOKING_BOT_USERNAME || 'LazarevBJJBot';

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

export async function fetchBookingStatus(id, token) {
  const res = await fetch(`${API_BASE}/api/bookings/${id}?token=${encodeURIComponent(token)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load booking status');
  const data = await res.json();
  return data.booking;
}

export async function cancelBooking(id, token) {
  const res = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Failed to cancel booking');
  const data = await res.json();
  return data.booking;
}
