"use client";

import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Truck, Award, Leaf, ArrowUp, ShieldCheck } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const router = useRouter();
  const { activeShop } = useContext(AuthContext);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', activeShop?.id],
    queryFn: () => api.getCategories(activeShop?.id),
    enabled: !!activeShop?.id,
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const colSize = Math.ceil(categories.length / 3);
  const col1 = categories.slice(0, colSize);
  const col2 = categories.slice(colSize, colSize * 2);
  const col3 = categories.slice(colSize * 2);

  return (
    <footer className={styles.footer}>
      {/* 1. Value Highlights Strip */}
      <div className={styles.highlightsStrip}>
        <div className={styles.container}>
          <div className={styles.highlightsGrid}>
            <div className={styles.highlightCard}>
              <div className={styles.highlightIconWrapper}>
                <Truck className={styles.highlightIcon} size={24} />
              </div>
              <div className={styles.highlightContent}>
                <h4 className={styles.highlightTitle}>Fast Delivery</h4>
                <p className={styles.highlightDesc}>Superfast delivery right to your doorstep.</p>
              </div>
            </div>
            <div className={styles.highlightCard}>
              <div className={styles.highlightIconWrapper}>
                <Leaf className={styles.highlightIcon} size={24} />
              </div>
              <div className={styles.highlightContent}>
                <h4 className={styles.highlightTitle}>100% Organic & Fresh</h4>
                <p className={styles.highlightDesc}>Directly sourced from trusted local farms.</p>
              </div>
            </div>
            <div className={styles.highlightCard}>
              <div className={styles.highlightIconWrapper}>
                <Award className={styles.highlightIcon} size={24} />
              </div>
              <div className={styles.highlightContent}>
                <h4 className={styles.highlightTitle}>Best Prices Guaranteed</h4>
                <p className={styles.highlightDesc}>Top quality groceries at the lowest rates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* 2. Main Content Grid */}
        <div className={styles.grid}>
          {/* Brand Info */}
          <div className={styles.brandSection}>
            <div className={styles.logoRow} onClick={() => router.push('/')}>
              <img src="/logo.png" alt="Fresh Sabji Hub Logo" className={styles.logoImage} />
              <span className={styles.logoText}>Fresh Sabji Hub</span>
            </div>
            <p className={styles.brandTagline}>
              India's premium organic grocery delivery app. Experience fresh vegetables, fruits, and dairy products at unmatched convenience and speed.
            </p>
            <div className={styles.securityWrapper}>
              <ShieldCheck size={18} className={styles.shieldIcon} />
              <span>100% Safe Payments</span>
            </div>
          </div>

          {/* Useful Links */}
          <div className={styles.linksSection}>
            <h3 className={styles.sectionHeading}>Useful Links</h3>
            <div className={styles.linkColumn}>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="#contact">Contact Support</a>
            </div>
          </div>

          {/* Categories */}
          <div className={styles.categoriesSection}>
            <div className={styles.categoriesHeader}>
              <h3 className={styles.sectionHeading}>Categories</h3>
              <button onClick={() => router.push('/categories')} className={styles.seeAllGreen}>
                see all
              </button>
            </div>
            <div className={styles.categoriesGrid}>
              <div className={styles.linkColumn}>
                {col1.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className={styles.linkColumn}>
                {col2.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className={styles.linkColumn}>
                {col3.map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/categories?cat=${cat.id}`)}
                    className={styles.dynamicCategoryBtn}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <span className={styles.copyright}>
              © 2026 Fresh Sabji Hub Private Limited. All rights reserved.
            </span>
          </div>

          <div className={styles.bottomRight}>
            {/* Socials */}
            <div className={styles.socialBadgesRow}>
              <a href="#facebook" className={styles.blackSocialBtn} aria-label="Facebook">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
              </a>
              <a href="#twitter" className={styles.blackSocialBtn} aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#instagram" className={styles.blackSocialBtn} aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>

            {/* Back to top */}
            <button className={styles.scrollTopBtn} onClick={scrollToTop} aria-label="Scroll to top">
              <span>Scroll to Top</span>
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
