"use client";

import React, { useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, AlertTriangle, Truck, Sparkles, Flame, Tag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import SafeImage from '../components/SafeImage';
import Loader from '../components/Loader';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import styles from './page.module.css';

function CategoryScrollArrows({ scrollRef }) {
  const scroll = useCallback((dir) => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  }, [scrollRef]);

  return (
    <div className={styles.scrollArrows}>
      <button className={styles.scrollArrowBtn} onClick={() => scroll('left')} aria-label="Scroll left">
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button className={styles.scrollArrowBtn} onClick={() => scroll('right')} aria-label="Scroll right">
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SpecialProductRow({ title, badge, badgeClass, products, router }) {
  const scrollRef = useRef(null);

  return (
    <section className={styles.productSection} style={{ marginBottom: '8px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <span className={badgeClass}>{badge}</span>
        </div>
        <div className={styles.sectionActions}>
          <CategoryScrollArrows scrollRef={scrollRef} />
        </div>
      </div>
      <div className={styles.productsTrack} ref={scrollRef}>
        {products.map((prod) => (
          <div key={prod.id} className={styles.productSlide}>
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}


function ProductRow({ cat, router, index }) {
  const scrollRef = useRef(null);

  return (
    <section className={styles.productSection} key={cat.id}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>{cat.name}</h2>
        </div>
        <div className={styles.sectionActions}>
          <CategoryScrollArrows scrollRef={scrollRef} />
          <button
            className={styles.viewAllBtn}
            onClick={() => router.push(`/categories?cat=${cat.id}`)}
          >
            See All <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className={styles.productsTrack} ref={scrollRef}>
        {cat.products.map((prod) => (
          <div key={prod.id} className={styles.productSlide}>
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}


export default function Home() {
  const router = useRouter();
  const { activeAddress, activeShop, serviceAvailable, loading } = useContext(AuthContext);

  const { data: banners = [], isLoading: isLoadingBanners } = useQuery({
    queryKey: ['banners'],
    queryFn: api.getBanners,
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
    enabled: !!activeShop?.id,
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['homeAllProducts', activeShop?.id],
    queryFn: () => api.getProducts({ shopId: activeShop?.id, limit: 100 }),
    enabled: !!activeShop?.id,
  });

  const allProducts = productsData?.products || [];

  const trendingProducts = allProducts.filter(p => p.type === 'trending');
  const bestDealProducts = allProducts.filter(p => p.type === 'best_deal');

  // Group products by category for horizontal listing
  const categoriesWithProducts = categories.map((cat) => {
    const products = allProducts.filter((p) => String(p.categoryId) === String(cat.id));
    return { ...cat, products };
  }).filter((cat) => cat.products.length > 0).slice(0, 5);

  // --- Empty States -----------------------------------------
  if (loading) {
    return <Loader />;
  }

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyStateIconWrap}>
          <MapPin size={32} strokeWidth={1.8} />
        </div>
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select or add a saved address to check serviceability and browse products.
        </p>
        <button 
          className={styles.emptyStateBtn}
          onClick={() => router.push('/addresses')}
        >
          Add Address
        </button>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={`${styles.emptyStateIconWrap} ${styles.warningIcon}`}>
          <AlertTriangle size={32} strokeWidth={1.8} />
        </div>
        <h2 className={styles.emptyStateTitle}>No Service Available</h2>
        <p className={styles.emptyStateText}>
          We currently do not support delivery to your selected location. Please select or add a different address.
        </p>
      </div>
    );
  }

  const isScreenLoading = isLoadingBanners || isLoadingCategories || isLoadingProducts;

  if (isScreenLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.homePage}>

      {/* --- Hero Banner Carousel ------------------------------ */}
      {homeTopBanners.length > 0 && (
        <section className={styles.heroBannerSection}>
          <BannerCarousel banners={homeTopBanners} />
        </section>
      )}

      {/* --- Shop by Category ---------------------------------- */}
      {categories.length > 0 && (
        <section className={styles.categorySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Shop by Category</h2>
            </div>
            <button
              className={styles.viewAllBtn}
              onClick={() => router.push('/categories')}
            >
              See All <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          <div className={styles.categoriesGrid}>
            {categories.slice(0, 10).map((cat, idx) => (
              <div
                key={cat.id}
                className={styles.categoryCard}
                onClick={() => router.push(`/categories?cat=${cat.id}`)}
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
        </section>
      )}


      {/* --- Trending Now Row --------------------------------- */}
      {trendingProducts.length > 0 && (
        <SpecialProductRow
          title="Trending Now"
          badge="🔥 Hot Picks"
          badgeClass={styles.trendingBadge}
          products={trendingProducts}
          router={router}
        />
      )}

      {/* --- Best Deals Row ----------------------------------- */}
      {bestDealProducts.length > 0 && (
        <SpecialProductRow
          title="Best Deals"
          badge="🏷️ Savings"
          badgeClass={styles.bestDealBadge}
          products={bestDealProducts}
          router={router}
        />
      )}

      {/* --- Category Product Rows ----------------------------- */}
      {categoriesWithProducts.map((cat, index) => (
        <React.Fragment key={cat.id}>
          <ProductRow cat={cat} router={router} index={index} />

          {/* Middle Promotions Banner after 2nd category */}
          {index === 1 && homeMiddleBanners.length > 0 && (
            <section className={styles.middleBannerSection}>
              <BannerCarousel banners={homeMiddleBanners} />
            </section>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
