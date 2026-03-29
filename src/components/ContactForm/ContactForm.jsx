import React, { useState } from 'react';
import SectionHeader from '../ui/SectionHeader';
import Button from '../ui/Button';
import { sendToTelegram } from '../../utils/telegram';
import styles from './ContactForm.module.css';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  function validate() {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Введите имя (минимум 2 символа)';
    }
    if (!formData.phone || formData.phone.trim().length === 0) {
      newErrors.phone = 'Введите номер телефона';
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setStatus('sending');
    try {
      await sendToTelegram(formData);
      setStatus('success');
      setFormData({ name: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  return (
    <section id="contact" className={styles.section}>
      <SectionHeader title="ЗАПИСАТЬСЯ" color="pink" />

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
            value={formData.phone}
            onChange={handleChange}
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

        <Button type="submit" variant="pink" disabled={status === 'sending'}>
          {status === 'sending' ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ЗАЯВКУ'}
        </Button>

        {status === 'success' && (
          <p className={styles.statusSuccess}>
            Заявка отправлена! Мы свяжемся с вами в ближайшее время.
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
