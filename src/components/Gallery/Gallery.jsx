import React, { useState } from 'react';
import styles from './Gallery.module.css';
import SectionHeader from '../ui/SectionHeader';

import imgCompetition from '../../assets/images/gallery/competition.jpg';
import imgGym from '../../assets/images/gallery/gym.jpg';
import imgTraining from '../../assets/images/gallery/training.jpg';
import imgKids from '../../assets/images/gallery/kids.jpg';
import imgSparring from '../../assets/images/gallery/sparring.jpg';
import imgMedal from '../../assets/images/gallery/medal.jpg';

const galleryItems = [
  { src: imgCompetition, label: 'Первенство России', span: 'tall' },
  { src: imgGym, label: 'В зале', span: 'normal' },
  { src: imgTraining, label: 'Тренировка', span: 'normal' },
  { src: imgSparring, label: 'На соревнованиях', span: 'wide' },
  { src: imgKids, label: 'Юные джитсеры', span: 'normal' },
  { src: imgMedal, label: 'Золото', span: 'tall' },
];

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section id="gallery" className={styles.section}>
      <div className={styles.container}>
        <SectionHeader title="ГАЛЕРЕЯ" />

        <div className={styles.grid}>
          {galleryItems.map((item, index) => (
            <button
              key={index}
              className={`${styles.imageWrapper} ${styles[item.span] || ''}`}
              onClick={() => setSelectedImage(index)}
              type="button"
              aria-label={`Открыть фото: ${item.label}`}
            >
              <img
                src={item.src}
                alt={item.label}
                className={`${styles.image} gta-photo`}
              />
              <span className={styles.imageLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        <p className={styles.hint}>
          Больше фото и видео в{' '}
          <a
            href="https://www.instagram.com/lazarev_ni.k"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </p>
      </div>

      {selectedImage !== null && (
        <div
          className={styles.lightbox}
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
        >
          <button
            className={styles.closeButton}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            type="button"
            aria-label="Закрыть"
          >
            &times;
          </button>
          <img
            src={galleryItems[selectedImage].src}
            alt={galleryItems[selectedImage].label}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
