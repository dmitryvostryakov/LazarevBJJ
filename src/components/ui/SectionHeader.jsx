import React from 'react';
import styles from './SectionHeader.module.css';

export default function SectionHeader({ title, color = 'cyan' }) {
  const colorClass = color === 'pink' ? styles.pink : color === 'yellow' ? styles.yellow : styles.cyan;

  return (
    <div className={`${styles.wrapper} ${colorClass}`}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.underline} />
    </div>
  );
}
