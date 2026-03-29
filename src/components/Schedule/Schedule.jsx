import React from 'react';
import styles from './Schedule.module.css';
import SectionHeader from '../ui/SectionHeader';

const kidsSchedule = [
  { day: 'Понедельник', time: '16:00 — 17:00', location: 'Bern, Автозаводская' },
  { day: 'Среда', time: '16:00 — 17:00', location: 'Bern, Автозаводская' },
  { day: 'Пятница', time: '16:00 — 17:00', location: 'Bern, Автозаводская' },
];

const adultsSchedule = [
  { day: 'Понедельник', time: '19:00 — 20:30', location: 'GM Gym, ул. 1905 года' },
  { day: 'Среда', time: '19:00 — 20:30', location: 'GM Gym, ул. 1905 года' },
  { day: 'Пятница', time: '19:00 — 20:30', location: 'Bern, Автозаводская' },
  { day: 'Суббота', time: '11:00 — 12:30', location: 'GM Gym, ул. 1905 года' },
];

const gyms = [
  {
    name: 'BERN',
    address: 'м. Автозаводская',
    description: 'Тренировки для детей и взрослых',
  },
  {
    name: 'GM GYM',
    address: 'м. Улица 1905 года',
    description: 'Тренировки для взрослых',
  },
];

function ScheduleCard({ day, time, location }) {
  return (
    <div className={styles.card}>
      <span className={styles.day}>{day}</span>
      <span className={styles.time}>{time}</span>
      <span className={styles.location}>{location}</span>
    </div>
  );
}

export default function Schedule() {
  return (
    <section id="schedule" className={styles.section}>
      <div className={styles.container}>
        <SectionHeader title="РАСПИСАНИЕ" color="pink" />

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>ДЕТИ</h3>
          <div className={styles.cardGrid}>
            {kidsSchedule.map((item) => (
              <ScheduleCard key={item.day} {...item} />
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>ВЗРОСЛЫЕ</h3>
          <div className={styles.cardGrid}>
            {adultsSchedule.map((item) => (
              <ScheduleCard key={item.day + item.location} {...item} />
            ))}
          </div>
        </div>

        <div className={styles.gymsSection}>
          <h3 className={styles.groupTitle}>ЗАЛЫ</h3>
          <div className={styles.gymsGrid}>
            {gyms.map((gym) => (
              <div key={gym.name} className={styles.gymCard}>
                <svg
                  className={styles.pinIcon}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className={styles.gymInfo}>
                  <span className={styles.gymName}>{gym.name}</span>
                  <span className={styles.gymAddress}>{gym.address}</span>
                  <span className={styles.gymDesc}>{gym.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
