"use client";

import React, { useContext, useRef, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, AlertTriangle, Truck, Sparkles } from 'lucide-react';
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

function OrderAgainRow({ products, router }) {
  const scrollRef = useRef(null);

  return (
    <section className={styles.productSection} style={{ marginBottom: '32px' }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Buy It Again</h2>
          <span className={styles.productCount} style={{ color: '#16a34a', backgroundColor: '#dcfce7', fontSize: '11px', fontWeight: '800' }}>
            Recently Ordered
          </span>
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

  const [reorderProducts, setReorderProducts] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pastOrders');
      if (saved && allProducts.length > 0) {
        try {
          const orders = JSON.parse(saved);
          const productIds = [];
          orders.forEach(order => {
            order.items?.forEach(item => {
              if (item.productId && !productIds.includes(item.productId)) {
                productIds.push(item.productId);
              }
            });
          });
          const matched = productIds
            .map(id => allProducts.find(p => String(p.id) === String(id)))
            .filter(Boolean);
          setReorderProducts(matched);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [allProducts]);

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

      {/* --- Order Again Row ----------------------------------- */}
      {reorderProducts.length > 0 && (
        <OrderAgainRow products={reorderProducts} router={router} />
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
