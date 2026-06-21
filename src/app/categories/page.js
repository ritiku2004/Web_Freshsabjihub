"use client";

import React, { useState, useEffect, Suspense, useContext } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import BannerCarousel from '../../components/BannerCarousel';
import ProductCard from '../../components/ProductCard';
import SafeImage from '../../components/SafeImage';
import Loader from '../../components/Loader';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import styles from '../page.module.css';

function CategoriesContent() {
  const { activeAddress, activeShop, serviceAvailable } = useContext(AuthContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  const catParam = searchParams.get('cat');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    setSelectedCategoryId(catParam);
  }, [catParam]);

  const handleCategorySelect = (id) => {
    if (id) {
      router.push(`/categories?cat=${id}`);
    } else {
      router.push(`/categories`);
    }
    setSelectedCategoryId(id);
  };

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: api.getBanners,
    enabled: !!activeAddress && !!serviceAvailable,
  });

  const categoryBanners = banners.filter(
    (b) => b.location === 'category' || b.location === 'categories'
  );

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', activeShop?.id],
    queryFn: () => api.getCategories(activeShop?.id),
    enabled: !!activeAddress && !!serviceAvailable && !!activeShop?.id,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['categoryProducts', activeShop?.id, selectedCategoryId],
    queryFn: () => api.getProducts({ shopId: activeShop?.id, categoryId: selectedCategoryId, limit: 100 }),
    enabled: !!activeAddress && !!serviceAvailable && !!activeShop?.id && !!selectedCategoryId,
  });

  const categoryProducts = productsData?.products || [];

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <span style={{ fontSize: '48px' }}>📍</span>
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select a saved address or enter a valid zipcode to browse category products.
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
          We do not deliver to zipcode <strong>{activeAddress.zipcode}</strong>.
        </p>
      </div>
    );
  }

  const isScreenLoading = isLoadingCategories || (selectedCategoryId && isLoadingProducts);

  if (isScreenLoading) {
    return <Loader text="Fetching fresh products..." />;
  }

  return (
    <div className={styles.categoriesPage}>
      {selectedCategoryId === null ? (
        /* "All Categories" view */
        <div className={styles.allCategoriesView}>
          {/* Top Promo Banner */}
          {categoryBanners.length > 0 && (
            <div className={styles.bannersSection}>
              <BannerCarousel banners={categoryBanners} />
            </div>
          )}

          {/* All Categories Grid */}
          <div className={styles.categoriesGrid}>
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className={styles.categoryCard}
                onClick={() => handleCategorySelect(cat.id)}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={styles.categoryImageWrap}>
                  <SafeImage
                    src={cat.image}
                    alt={cat.name}
                    className={styles.categoryImage}
                  />
                  <div className={styles.categoryImageGlow} />
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* "Category Products" view */
        <div className={styles.categoryProductsContainer}>
          {/* Custom mobile-only green category header */}
          <div className={styles.customCategoryHeader}>
            <button 
              className={styles.headerBackBtn} 
              onClick={() => handleCategorySelect(null)}
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className={styles.headerTitle}>
              {categories.find((c) => c.id === selectedCategoryId)?.name || 'Products'}
            </h1>
            <button className={styles.headerFilterBtn} aria-label="Filters">
              <SlidersHorizontal size={22} />
            </button>
          </div>

          {/* Breadcrumb back navigation button for Desktop */}
          <button 
            className={styles.backToCategoriesBtn} 
            onClick={() => handleCategorySelect(null)}
          >
            ← Back to All Categories
          </button>

          <div className={styles.categoryProductsLayout}>
            <aside className={styles.categorySidebar}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.sidebarBtn} ${selectedCategoryId === cat.id ? styles.activeSidebarBtn : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </aside>

            <div className={styles.categoryProductsGrid}>
              <h3 className={styles.categoryTabTitle}>
                {categories.find((c) => c.id === selectedCategoryId)?.name || 'Products'}
              </h3>

              <div className={styles.productsGrid}>
                {categoryProducts.map((prod) => (
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
