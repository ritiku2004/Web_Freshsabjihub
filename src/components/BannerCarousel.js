"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import styles from './BannerCarousel.module.css';

export default function BannerCarousel({ banners = [] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const goTo = useCallback((dir) => {
    setActiveIndex((prev) => {
      if (dir === 'next') return (prev + 1) % banners.length;
      return prev === 0 ? banners.length - 1 : prev - 1;
    });
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className={styles.carouselContainer}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={styles.slidesWrapper}
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const resolvedImage = banner.image ? (banner.image.startsWith('/') && !banner.image.startsWith('//') ? (banner.image.startsWith('/uploads/') ? `https://api.freshsabjihub.com${banner.image}` : banner.image) : (banner.image.startsWith('uploads/') ? `https://api.freshsabjihub.com/${banner.image}` : banner.image)) : '';
          const bg = banner.backgroundColor || '#E8F5E9';
          const textCol = banner.textColor || (resolvedImage ? '#ffffff' : '#2E7D32');

          return (
            <div
              key={banner.id || index}
              className={styles.slide}
              style={{ 
                backgroundColor: bg,
                backgroundImage: resolvedImage ? `url(${resolvedImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className={styles.slideGradient} />
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
                <button 
                  className={styles.shopNowBtn}
                  onClick={() => router.push('/categories')}
                >
                  Shop Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            className={`${styles.navArrow} ${styles.navPrev}`}
            onClick={() => goTo('prev')}
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            className={`${styles.navArrow} ${styles.navNext}`}
            onClick={() => goTo('next')}
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Indicator Dots */}
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
