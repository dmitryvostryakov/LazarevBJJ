import React from 'react';
import styles from './Hero.module.css';
import heroImg from '../../assets/images/hero-nikita.jpg';
import GlitchText from '../ui/GlitchText';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <img
        src={heroImg}
        alt="Никита Лазарев — тренер по джиу-джитсу"
        className={styles.heroImage}
      />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <h1 className={styles.name}>
          <GlitchText>НИКИТА ЛАЗАРЕВ</GlitchText>
        </h1>
        <p className={styles.subtitle}>
          ТРЕНЕР ПО ДЖИУ-ДЖИТСУ | МОСКВА
        </p>
        <Button variant="cyan" href="#contact">
          ЗАПИСАТЬСЯ
        </Button>
      </div>

      <div className={styles.loadingBar}>
        <div className={styles.loadingFill} />
      </div>
    </section>
  );
}
