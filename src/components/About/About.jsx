import React from 'react';
import styles from './About.module.css';
import SectionHeader from '../ui/SectionHeader';

const stats = [
  { value: '10+', label: 'ЛЕТ ОПЫТА' },
  { value: '1000+', label: 'УЧЕНИКОВ' },
  { value: 'КОРИЧНЕВЫЙ', label: 'ПОЯС BJJ' },
];

export default function About() {
  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <SectionHeader title="О ТРЕНЕРЕ" />

        <div className={styles.grid}>
          <div className={styles.bio}>
            <p>
              Никита Лазарев — мастер спорта по джиу-джитсу, обладатель
              коричневого пояса BJJ, член команды Team Strela. Многократный
              победитель крупнейших турниров: золото Первенства России
              по грэпплингу, золото ACB Russia JJ и ACB World JJ.
            </p>
            <p>
              Философия тренировок строится на индивидуальном подходе
              к каждому ученику. Независимо от возраста и уровня подготовки,
              каждый получает программу, адаптированную под его цели — будь то
              самооборона, соревновательная подготовка или общая физическая
              форма.
            </p>
            <p>
              Никита тренирует в двух залах Москвы — Bern на Автозаводской
              и GM Gym в районе улицы 1905 года. На занятиях царит атмосфера
              взаимного уважения и поддержки. Среди его учеников — призёры
              городских и региональных соревнований.
            </p>
          </div>

          <div className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
