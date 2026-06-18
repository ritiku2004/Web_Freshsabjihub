"use client";

import React, { useState, useEffect } from 'react';
import styles from './BannerCarousel.module.css';

export default function BannerCarousel({ banners = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className={styles.carouselContainer}>
      <div
        className={styles.slidesWrapper}
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const bg = banner.backgroundColor || '#E8F5E9';
          const textCol = banner.textColor || '#2E7D32';

          return (
            <div
              key={banner.id || index}
              className={styles.slide}
              style={{ backgroundColor: bg, color: textCol }}
            >
              <div className={styles.bannerLeft}>
                {banner.subtitle && (
                  <span className={styles.subtitle} style={{ color: textCol }}>
                    {banner.subtitle}
                  </span>
                )}
                <h2 className={styles.title} style={{ color: textCol }}>
                  {banner.title}
                </h2>
                {banner.description && (
                  <p className={styles.desc} style={{ color: textCol }}>
                    {banner.description}
                  </p>
                )}
                <button className={styles.shopNowBtn}>Shop Now</button>
              </div>
              <div className={styles.bannerRight}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image}
                  alt={banner.title}
                  className={styles.bannerImage}
                />
              </div>
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <div className={styles.indicatorRow}>
          {banners.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${activeIndex === index ? styles.activeDot : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
