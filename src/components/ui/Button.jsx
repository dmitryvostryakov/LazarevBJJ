import React from 'react';
import styles from './Button.module.css';

export default function Button({ children, onClick, href, variant = 'cyan', type = 'button', disabled }) {
  const className = `${styles.button} ${variant === 'pink' ? styles.pink : styles.cyan}`;

  if (href) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
