import React, { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'О ТРЕНЕРЕ', href: '#about' },
  { label: 'РАСПИСАНИЕ', href: '#schedule' },
  { label: 'ГАЛЕРЕЯ', href: '#gallery' },
  { label: 'ОТЗЫВЫ', href: '#reviews' },
  { label: 'КОНТАКТЫ', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <a href="#" className={styles.logo}>
        LAZAREV BJJ
      </a>

      <ul className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
        {NAV_LINKS.map(({ label, href }) => (
          <li key={href}>
            <a href={href} className={styles.navLink} onClick={handleLinkClick}>
              {label}
            </a>
          </li>
        ))}
      </ul>

      <button
        className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Открыть меню"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}
