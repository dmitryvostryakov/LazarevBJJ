import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'altcha';
import SectionHeader from '../ui/SectionHeader';
import Button from '../ui/Button';
import { fetchAvailability, createBooking, API_BASE } from '../../utils/api';
import {
  FORMATS,
  AUDIENCES,
  GROUP_SIZES,
  GYMS,
  getPrice,
  getAvailableDates,
} from '../../data/booking';
import styles from './ContactForm.module.css';

const availableDates = getAvailableDates();
const CAPTCHA_CHALLENGE_URL = `${API_BASE}/api/captcha/challenge`;

// Formats any raw input into a Russian phone mask: +7 (9XX) XXX-XX-XX.
// Handles typing from 9 (auto-prefixes +7), pasting 8XXXXXXXXXX or
// +7XXXXXXXXXXX, and backspacing down to empty.
function formatRuPhone(rawValue) {
  let digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  if (digits[0] === '8' || digits[0] === '7') {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (!digits) return '';

  let out = '+7 (' + digits.slice(0, 3);
  if (digits.length >= 3) out += ')';
  if (digits.length > 3) out += ' ' + digits.slice(3, 6);
  if (digits.length > 6) out += '-' + digits.slice(6, 8);
  if (digits.length > 8) out += '-' + digits.slice(8, 10);
  return out;
}

export default function ContactForm() {
  const [format, setFormat] = useState(FORMATS[0].id);
  const [audience, setAudience] = useState(AUDIENCES[FORMATS[0].id][0].id);
  const [groupSize, setGroupSize] = useState(GROUP_SIZES[0]);
  const [gym, setGym] = useState(GYMS[0].id);
  const [date, setDate] = useState(availableDates[0].value);
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [captchaValue, setCaptchaValue] = useState(null);
  const altchaRef = useRef(null);

  // Slots the current format can actually use: personal only wants fully open
  // slots, group wants both open (start a new session) and joinable (room left).
  const usableSlots = useMemo(
    () => slots.filter((s) => format === 'personal' ? s.status === 'open' : true),
    [slots, format]
  );
  const selectedSlot = useMemo(
    () => usableSlots.find((s) => s.time === time) || null,
    [usableSlots, time]
  );
  const joiningGroup = format === 'group' && selectedSlot?.status === 'group_joinable';

  const price = useMemo(() => {
    if (joiningGroup) return selectedSlot.pricePerHead;
    return getPrice({ format, audience, groupSize });
  }, [joiningGroup, selectedSlot, format, audience, groupSize]);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(false);
    fetchAvailability(gym, date)
      .then((availableSlots) => {
        if (cancelled) return;
        setSlots(availableSlots);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setSlotsLoading(false);
      });
    return () => { cancelled = true; };
  }, [gym, date]);

  // Keep the selected time valid whenever the usable slot list changes
  // (new gym/date loaded, or format switched between personal/group).
  useEffect(() => {
    if (!usableSlots.some((s) => s.time === time)) {
      setTime(usableSlots[0]?.time || '');
    }
  }, [usableSlots]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = altchaRef.current;
    if (!el) return undefined;
    // ALTCHA writes the solved payload into a hidden <input name="altcha">
    // it renders as a light-DOM child of the widget (so it works in native forms too).
    function onStateChange(e) {
      if (e.detail.state !== 'verified') {
        setCaptchaValue(null);
        return;
      }
      const input = el.querySelector('input[name="altcha"]');
      setCaptchaValue(input?.value || null);
    }
    el.addEventListener('statechange', onStateChange);
    return () => el.removeEventListener('statechange', onStateChange);
  }, []);

  function handleFormatChange(newFormat) {
    setFormat(newFormat);
    setAudience(AUDIENCES[newFormat][0].id);
  }

  function validate() {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Введите имя (минимум 2 символа)';
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'Введите номер телефона';
    } else if (phoneDigits.length < 11) {
      newErrors.phone = 'Введите полный номер телефона';
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (!time) return;
    if (!captchaValue) return;

    setStatus('sending');
    try {
      await createBooking({
        gym,
        date,
        time,
        format,
        audience,
        groupSize: format === 'group' && !joiningGroup ? groupSize : null,
        name: formData.name,
        phone: formData.phone,
        message: formData.message,
        altcha: captchaValue,
      });
      setStatus('success');
      setFormData({ name: '', phone: '', message: '' });
      const refreshed = await fetchAvailability(gym, date);
      setSlots(refreshed);
    } catch (err) {
      if (err.code === 'CAPTCHA_FAILED') {
        setCaptchaValue(null);
        altchaRef.current?.reset();
      }
      setStatus(
        err.code === 'SLOT_TAKEN' ? 'slot-taken'
          : err.code === 'CAPTCHA_FAILED' ? 'captcha-error'
          : 'error'
      );
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handlePhoneChange(e) {
    const formatted = formatRuPhone(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  }

  return (
    <section id="contact" className={styles.section}>
      <SectionHeader title="ЗАПИСАТЬСЯ" color="pink" />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label}>Формат тренировки</label>
          <div className={styles.toggleGroup}>
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.toggle} ${format === f.id ? styles.toggleActive : ''}`}
                onClick={() => handleFormatChange(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Группа</label>
          <div className={styles.toggleGroup}>
            {AUDIENCES[format].map((a) => (
              <button
                key={a.id}
                type="button"
                className={`${styles.toggle} ${audience === a.id ? styles.toggleActive : ''}`}
                onClick={() => setAudience(a.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {format === 'group' && !joiningGroup && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-group-size">Количество участников</label>
            <select
              id="booking-group-size"
              className={styles.input}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
            >
              {GROUP_SIZES.map((size) => (
                <option key={size} value={size}>{size} человека(-ек)</option>
              ))}
            </select>
          </div>
        )}

        {joiningGroup && (
          <div className={styles.field}>
            <p className={styles.groupJoinNote}>
              Вы присоединяетесь к группе {selectedSlot.joined}/{selectedSlot.groupSize}
              {' '}— осталось {selectedSlot.remaining} {selectedSlot.remaining === 1 ? 'место' : 'места'}.
              Цена зафиксирована организатором группы.
            </p>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-gym">Зал</label>
            <select
              id="booking-gym"
              className={styles.input}
              value={gym}
              onChange={(e) => setGym(e.target.value)}
            >
              {GYMS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-date">Дата</label>
            <select
              id="booking-date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              {availableDates.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

        </div>

        <div className={styles.field}>
          <label className={styles.label}>Время</label>
          <div className={styles.slotGrid}>
            {slots.map((s) => {
              const usable = usableSlots.some((u) => u.time === s.time);
              const isSelected = time === s.time;
              const badge = s.status === 'taken'
                ? 'занято'
                : s.status === 'group_joinable'
                  ? (format === 'group' ? `${s.remaining} мест` : 'группа')
                  : null;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!usable}
                  onClick={() => usable && setTime(s.time)}
                  className={[
                    styles.slot,
                    isSelected ? styles.slotSelected : '',
                    !usable ? styles.slotTaken : '',
                    usable && s.status === 'group_joinable' ? styles.slotJoinable : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className={styles.slotTime}>{s.time}</span>
                  {badge && <span className={styles.slotBadge}>{badge}</span>}
                </button>
              );
            })}
          </div>
          {slotsLoading && <span className={styles.slotHint}>Загрузка...</span>}
          {!slotsLoading && slots.length === 0 && (
            <span className={styles.slotHint}>Нет слотов на эту дату</span>
          )}
          {slotsError && <span className={styles.error}>Не удалось загрузить свободное время</span>}
        </div>

        <div className={styles.priceBox}>
          <span className={styles.priceLabel}>Стоимость</span>
          <span className={styles.priceValue}>
            {price} ₽{format === 'group' ? ' / чел.' : ''}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-name">Имя</label>
          <input
            id="contact-name"
            className={styles.input}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ваше имя"
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-phone">Телефон</label>
          <input
            id="contact-phone"
            className={styles.input}
            type="tel"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            required
            placeholder="+7 (___) ___-__-__"
          />
          {errors.phone && <span className={styles.error}>{errors.phone}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-message">Сообщение</label>
          <textarea
            id="contact-message"
            className={styles.textarea}
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Ваш вопрос или комментарий"
          />
        </div>

        <div className={styles.field}>
          <altcha-widget
            ref={altchaRef}
            challenge={CAPTCHA_CHALLENGE_URL}
            configuration='{"hideFooter":true,"hideLogo":true}'
            style={{ '--altcha-max-width': '100%' }}
          />
        </div>

        <Button type="submit" variant="pink" disabled={status === 'sending' || !time || !captchaValue}>
          {status === 'sending' ? 'ОТПРАВКА...' : 'ЗАБРОНИРОВАТЬ ТРЕНИРОВКУ'}
        </Button>

        {status === 'success' && (
          <p className={styles.statusSuccess}>
            Заявка отправлена! Никита подтвердит время в течение дня.
          </p>
        )}
        {status === 'slot-taken' && (
          <p className={styles.statusError}>
            Это время только что забронировали. Выберите другое.
          </p>
        )}
        {status === 'captcha-error' && (
          <p className={styles.statusError}>
            Проверка "я не робот" не прошла. Попробуйте ещё раз.
          </p>
        )}
        {status === 'error' && (
          <p className={styles.statusError}>
            Ошибка отправки. Попробуйте ещё раз.
          </p>
        )}
      </form>

      <div className={styles.socials}>
        <a
          href="https://www.instagram.com/lazarev_ni.k"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
          </svg>
          <span>Instagram</span>
        </a>
        <a
          href="https://vk.com/lazarevbjj"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.785 16.241s.288-.032.436-.192c.136-.148.132-.428.132-.428s-.02-1.308.588-1.5c.6-.188 1.368 1.248 2.184 1.8.616.416 1.084.324 1.084.324l2.18-.032s1.14-.072.6-.98c-.044-.074-.316-.672-1.628-1.9-1.372-1.288-1.188-1.08.464-3.304.504-.68 1.632-2.18 1.3-2.572-.12-.148-.856-.2-.856-.2l-2.456.016s-.18-.024-.316.056c-.132.08-.216.264-.216.264s-.392 1.044-.912 1.932c-1.1 1.88-1.54 1.98-1.72 1.864-.416-.272-.312-1.092-.312-1.672 0-1.816.276-2.576-.536-2.772-.268-.064-.468-.108-1.16-.116-.888-.008-1.64.004-2.064.212-.284.14-.5.448-.368.464.164.024.536.1.732.368.256.348.248 1.128.248 1.128s.148 2.14-.344 2.404c-.336.18-.8-.188-1.788-1.868-.508-.86-.892-1.812-.892-1.812s-.076-.18-.208-.28c-.16-.12-.384-.16-.384-.16l-2.332.016s-.352.008-.48.16c-.116.14-.008.42-.008.42s1.836 4.292 3.916 6.456c1.904 1.98 4.068 1.848 4.068 1.848h.98z"/>
          </svg>
          <span>VK</span>
        </a>
        <a
          href="https://t.me/Nikitoro670"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span>Telegram</span>
        </a>
      </div>
    </section>
  );
}
