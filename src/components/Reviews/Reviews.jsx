import React from 'react';
import styles from './Reviews.module.css';
import SectionHeader from '../ui/SectionHeader';

const reviews = [
  {
    text: 'Тренирую у Никиты уже 2 года. Отличный тренер, который находит подход к каждому ученику. Прогресс виден с первых занятий!',
    author: 'Алексей М.',
    detail: '28 лет',
  },
  {
    text: 'Привёл сына на тренировки, результат превзошёл ожидания. Ребёнок стал увереннее и дисциплинированнее.',
    author: 'Ирина К.',
    detail: 'мама ученика',
  },
  {
    text: 'Лучший зал по джиу-джитсу в Москве. Никита — профессионал, который горит своим делом.',
    author: 'Дмитрий С.',
    detail: '35 лет',
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className={styles.section}>
      <div className={styles.container}>
        <SectionHeader title="ОТЗЫВЫ" color="yellow" />

        <div className={styles.grid}>
          {reviews.map((review, index) => (
            <div key={index} className={styles.card}>
              <span className={styles.quote}>&ldquo;</span>
              <p className={styles.text}>{review.text}</p>
              <div className={styles.authorBlock}>
                <span className={styles.author}>{review.author}</span>
                <span className={styles.detail}>{review.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
