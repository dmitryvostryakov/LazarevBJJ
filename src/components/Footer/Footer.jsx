import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.socials}>
        <a
          href="https://www.instagram.com/lazarev_ni.k"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Instagram"
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a
          href="https://vk.com/lazarevbjj"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="VK"
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.785 16.241s.288-.032.436-.192c.136-.148.132-.428.132-.428s-.02-1.308.588-1.5c.6-.188 1.368 1.248 2.184 1.8.616.416 1.084.324 1.084.324l2.18-.032s1.14-.072.6-.98c-.044-.074-.316-.672-1.628-1.9-1.372-1.288-1.188-1.08.464-3.304.504-.68 1.632-2.18 1.3-2.572-.12-.148-.856-.2-.856-.2l-2.456.016s-.18-.024-.316.056c-.132.08-.216.264-.216.264s-.392 1.044-.912 1.932c-1.1 1.88-1.54 1.98-1.72 1.864-.416-.272-.312-1.092-.312-1.672 0-1.816.276-2.576-.536-2.772-.268-.064-.468-.108-1.16-.116-.888-.008-1.64.004-2.064.212-.284.14-.5.448-.368.464.164.024.536.1.732.368.256.348.248 1.128.248 1.128s.148 2.14-.344 2.404c-.336.18-.8-.188-1.788-1.868-.508-.86-.892-1.812-.892-1.812s-.076-.18-.208-.28c-.16-.12-.384-.16-.384-.16l-2.332.016s-.352.008-.48.16c-.116.14-.008.42-.008.42s1.836 4.292 3.916 6.456c1.904 1.98 4.068 1.848 4.068 1.848h.98z"/>
          </svg>
        </a>
        <a
          href="https://t.me/Nikitoro670"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
          aria-label="Telegram"
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </a>
      </div>

      <p className={styles.copyright}>
        &copy; 2026 LAZAREV BJJ. Все права защищены.
      </p>

      <p className={styles.vibes}>
        DESIGNED WITH GTA VIBES
      </p>
    </footer>
  );
}
