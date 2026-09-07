import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import { fetchBookingStatus, cancelBooking } from '../../utils/api';
import { GYMS } from '../../data/booking';
import styles from './BookingStatus.module.css';

const STATUS_LABELS = {
  pending: 'Ожидает подтверждения',
  confirmed: 'Подтверждено',
  declined: 'Отклонено',
  cancelled: 'Отменено',
};

const FORMAT_LABELS = { personal: 'Персональная', group: 'Мини-группа' };
const GYM_LABELS = Object.fromEntries(GYMS.map((g) => [g.id, g.label]));

export default function BookingStatus({ id, token, onClose }) {
  const [booking, setBooking] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [cancelState, setCancelState] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    fetchBookingStatus(id, token)
      .then((b) => {
        if (cancelled) return;
        if (!b) {
          setLoadState('not-found');
          return;
        }
        setBooking(b);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => { cancelled = true; };
  }, [id, token]);

  async function handleCancel() {
    setCancelState('cancelling');
    try {
      const updated = await cancelBooking(id, token);
      setBooking(updated);
      setCancelState('idle');
    } catch {
      setCancelState('error');
    }
  }

  const canCancel = booking && ['pending', 'confirmed'].includes(booking.status);

  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <h2 className={styles.title}>Статус записи</h2>

        {loadState === 'loading' && <p className={styles.hint}>Загрузка...</p>}
        {loadState === 'not-found' && (
          <p className={styles.error}>Заявка не найдена — проверьте ссылку.</p>
        )}
        {loadState === 'error' && (
          <p className={styles.error}>Не удалось загрузить статус. Попробуйте позже.</p>
        )}

        {booking && (
          <div className={styles.details}>
            <div className={[styles.badge, styles[`badge_${booking.status}`] || ''].join(' ')}>
              {STATUS_LABELS[booking.status] || booking.status}
            </div>
            <dl className={styles.list}>
              <dt>Дата и время</dt>
              <dd>{booking.date} в {booking.time}</dd>
              <dt>Зал</dt>
              <dd>{GYM_LABELS[booking.gym] || booking.gym}</dd>
              <dt>Формат</dt>
              <dd>{FORMAT_LABELS[booking.format] || booking.format} — {booking.audience}</dd>
              <dt>Имя</dt>
              <dd>{booking.name}</dd>
              {booking.price && (
                <>
                  <dt>Стоимость</dt>
                  <dd>{booking.price} ₽{booking.format === 'group' ? ' / чел.' : ''}</dd>
                </>
              )}
            </dl>

            {canCancel && (
              <Button variant="pink" onClick={handleCancel} disabled={cancelState === 'cancelling'}>
                {cancelState === 'cancelling' ? 'ОТМЕНА...' : 'ОТМЕНИТЬ ТРЕНИРОВКУ'}
              </Button>
            )}
            {cancelState === 'error' && (
              <p className={styles.error}>Не удалось отменить. Попробуйте ещё раз.</p>
            )}
          </div>
        )}

        <button type="button" className={styles.backLink} onClick={onClose}>
          ← Вернуться на сайт
        </button>
      </div>
    </section>
  );
}
