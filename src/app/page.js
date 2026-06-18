"use client";

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import { AuthContext } from '../context/AuthContext';
import { MOCK_BANNERS, MOCK_CATEGORIES, MOCK_PRODUCTS } from './data';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { activeAddress, serviceAvailable } = useContext(AuthContext);

  const homeTopBanners = MOCK_BANNERS.filter((b) => b.location === 'home_top');
  const homeMiddleBanners = MOCK_BANNERS.filter((b) => b.location === 'home_middle');

  // Group products by category for horizontal listing
  const categoriesWithProducts = MOCK_CATEGORIES.map((cat) => {
    const products = MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id);
    return { ...cat, products };
  }).filter((cat) => cat.products.length > 0);

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <span style={{ fontSize: '48px' }}>📍</span>
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select a saved address or enter a valid zipcode to check serviceability and browse products.
        </p>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className={styles.emptyStateContainer}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 className={styles.emptyStateTitle}>No Service Available</h2>
        <p className={styles.emptyStateText}>
          We do not deliver to zipcode <strong>{activeAddress.zipcode}</strong>. We currently support select zipcodes of Noida and New Delhi (e.g. 10001 or 110070).
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Slide Carousel */}
      {homeTopBanners.length > 0 && (
        <div className={styles.bannersSection}>
          <BannerCarousel banners={homeTopBanners} />
        </div>
      )}

      {/* Shop by Category circular grid */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Shop by Category</h3>
        <button className={styles.seeAllText} onClick={() => router.push('/categories')}>
          See All
        </button>
      </div>

      <div className={styles.categoriesGrid}>
        {MOCK_CATEGORIES.slice(0, 5).map((cat) => (
          <div
            key={cat.id}
            className={styles.categoryCircleCard}
            onClick={() => {
              router.push(`/categories?cat=${cat.id}`);
            }}
          >
            <div className={styles.categoryImageContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.name}
                className={styles.categoryCircleImage}
              />
            </div>
            <span className={styles.categoryCircleName}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Category Products Scrollers */}
      {categoriesWithProducts.map((cat, index) => (
        <div key={cat.id} className={styles.productsRow}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{cat.name}</h3>
            <button
              className={styles.seeAllText}
              onClick={() => {
                router.push(`/categories?cat=${cat.id}`);
              }}
            >
              See All
            </button>
          </div>

          <div className={styles.productsHorizontalScroll}>
            {cat.products.map((prod) => (
              <div key={prod.id} className={styles.horizontalCardWrapper}>
                <ProductCard product={prod} />
              </div>
            ))}
          </div>

          {/* Middle Promotions Banner */}
          {index === 1 && homeMiddleBanners.length > 0 && (
            <div className={styles.bannersSection} style={{ marginTop: '24px' }}>
              <BannerCarousel banners={homeMiddleBanners} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
