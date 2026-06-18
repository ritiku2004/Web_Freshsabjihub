"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BannerCarousel from '../../components/BannerCarousel';
import ProductCard from '../../components/ProductCard';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_CATEGORIES_BANNER } from '../data';
import styles from '../page.module.css';

function CategoriesContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    setSelectedCategoryId(catParam);
  }, [catParam]);

  return (
    <div className={styles.categoriesPage}>
      {selectedCategoryId === null ? (
        /* "All Categories" view */
        <div className={styles.allCategoriesView}>
          {/* Top Promo Banner */}
          <div className={styles.bannersSection}>
            <BannerCarousel banners={MOCK_CATEGORIES_BANNER} />
          </div>

          {/* All Categories Grid */}
          <div className={styles.categoriesGrid}>
            {MOCK_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className={styles.categoryCircleCard}
                onClick={() => setSelectedCategoryId(cat.id)}
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
        </div>
      ) : (
        /* "Category Products" view */
        <div className={styles.categoryProductsContainer}>
          {/* Breadcrumb back navigation button for Desktop */}
          <button 
            className={styles.backToCategoriesBtn} 
            onClick={() => setSelectedCategoryId(null)}
          >
            ← Back to All Categories
          </button>

          <div className={styles.categoryProductsLayout}>
            <aside className={styles.categorySidebar}>
              {MOCK_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.sidebarBtn} ${selectedCategoryId === cat.id ? styles.activeSidebarBtn : ''}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </aside>

            <div className={styles.categoryProductsGrid}>
              <h3 className={styles.categoryTabTitle}>
                {MOCK_CATEGORIES.find((c) => c.id === selectedCategoryId)?.name || 'Products'}
              </h3>

              <div className={styles.productsGrid}>
                {MOCK_PRODUCTS.filter((p) => p.categoryId === selectedCategoryId).map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className={styles.emptyStateContainer}><h2>Loading Categories...</h2></div>}>
      <CategoriesContent />
    </Suspense>
  );
}
