import React from 'react';
import styles from './GlitchText.module.css';

export default function GlitchText({ children, className = '' }) {
  return (
    <span
      className={`${styles.glitch} ${className}`}
      data-text={typeof children === 'string' ? children : ''}
    >
      {children}
    </span>
  );
}
