"use client";

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import SafeImage from '../components/SafeImage';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { activeAddress, activeShop, serviceAvailable } = useContext(AuthContext);

  const { data: banners = [], isLoading: isLoadingBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: api.getBanners,
    enabled: !!activeAddress && !!serviceAvailable,
  });

  const homeTopBanners = banners.filter(
    (b) => b.location === 'home_top' || b.location === 'hometop'
  );
  const homeMiddleBanners = banners.filter(
    (b) => b.location === 'home_middle' || b.location === 'homemiddle'
  );

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', activeShop?.id],
    queryFn: () => api.getCategories(activeShop?.id),
    enabled: !!activeAddress && !!serviceAvailable && !!activeShop?.id,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['homeAllProducts', activeShop?.id],
    queryFn: () => api.getProducts({ shopId: activeShop?.id, limit: 100 }),
    enabled: !!activeAddress && !!serviceAvailable && !!activeShop?.id,
  });

  const allProducts = productsData?.products || [];

  // Group products by category for horizontal listing
  const categoriesWithProducts = categories.map((cat) => {
    const products = allProducts.filter((p) => String(p.categoryId) === String(cat.id));
    return { ...cat, products };
  }).filter((cat) => cat.products.length > 0).slice(0, 5);

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

  const isScreenLoading = isLoadingBanners || isLoadingCategories || isLoadingProducts;

  if (isScreenLoading) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.loaderSpinner} />
        <h2 className={styles.emptyStateTitle}>Loading Fresh Sabji...</h2>
        <p className={styles.emptyStateText}>Fetching catalog items from server...</p>
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
        {categories.slice(0, 5).map((cat) => (
          <div
            key={cat.id}
            className={styles.categoryCircleCard}
            onClick={() => {
              router.push(`/categories?cat=${cat.id}`);
            }}
          >
            <div className={styles.categoryImageContainer}>
              <SafeImage
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
