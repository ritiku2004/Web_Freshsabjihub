"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer({ onTabChange }) {
  const router = useRouter();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* 1. Main Links & Categories Grid */}
        <div className={styles.grid}>
          
          {/* Left Side: Useful Links (3 Columns) */}
          <div className={styles.usefulLinksSection}>
            <h3 className={styles.sectionHeading}>Useful Links</h3>
            <div className={styles.linksSubGrid}>
              <div className={styles.linkColumn}>
                <a href="#blog">Blog</a>
                <a href="#privacy">Privacy</a>
                <a href="#terms">Terms</a>
                <a href="#faqs">FAQs</a>
                <a href="#security">Security</a>
                <a href="#contact">Contact</a>
              </div>
              <div className={styles.linkColumn}>
                <a href="#partner">Partner</a>
                <a href="#franchise">Franchise</a>
                <a href="#seller">Seller</a>
                <a href="#warehouse">Warehouse</a>
                <a href="#deliver">Deliver</a>
                <a href="#resources">Resources</a>
              </div>
              <div className={styles.linkColumn}>
                <a href="#recipes">Recipes</a>
                <a href="#bistro">Bistro</a>
                <a href="#district">District</a>
                <a href="#ambulance">Blinkit Ambulance</a>
              </div>
            </div>
          </div>

          {/* Right Side: Categories (3 Columns) */}
          <div className={styles.categoriesSection}>
            <h3 className={styles.sectionHeading}>
              Categories 
              <button onClick={() => router.push('/categories')} className={styles.seeAllGreen}>
                see all
              </button>
            </h3>
            <div className={styles.linksSubGrid}>
              <div className={styles.linkColumn}>
                <a href="#bath-body">Bath & Body</a>
                <a href="#beauty-cosmetics">Beauty & Cosmetics</a>
                <a href="#health-pharma">Health & Pharma</a>
                <button onClick={() => router.push('/categories?cat=cat2')}>Atta, Rice & Dal</button>
                <button onClick={() => router.push('/categories?cat=cat4')}>Bakery & Biscuits</button>
                <a href="#kitchenware">Kitchenware & Appliances</a>
                <button onClick={() => router.push('/categories?cat=cat5')}>Drinks & Juices</button>
                <a href="#sauces">Sauces & Spreads</a>
                <a href="#home-lifestyle">Home & Lifestyle</a>
                <a href="#stationery">Stationery & Games</a>
                <a href="#gifts">Rakhi Gifts</a>
              </div>
              <div className={styles.linkColumn}>
                <a href="#hair">Hair</a>
                <a href="#feminine-hygiene">Feminine Hygiene</a>
                <a href="#sexual-wellness">Sexual Wellness</a>
                <a href="#oil-ghee">Oil, Ghee & Masala</a>
                <a href="#dry-fruits">Dry Fruits & Cereals</a>
                <button onClick={() => router.push('/categories?cat=cat4')}>Chips & Namkeen</button>
                <button onClick={() => router.push('/categories?cat=cat5')}>Tea, Coffee & Milk Drinks</button>
                <a href="#paan">Paan Corner</a>
                <a href="#cleaners">Cleaners & Repellents</a>
                <a href="#print">Print Store</a>
              </div>
              <div className={styles.linkColumn}>
                <a href="#skin-face">Skin & Face</a>
                <a href="#baby-care">Baby Care</a>
                <button onClick={() => router.push('/categories?cat=cat2')}>Vegetables & Fruits</button>
                <button onClick={() => router.push('/categories?cat=cat3')}>Dairy, Bread & Eggs</button>
                <a href="#meat">Chicken, Meat & Fish</a>
                <a href="#sweets">Sweets & Chocolates</a>
                <a href="#instant-food">Instant Food</a>
                <a href="#ice-creams">Ice Creams & More</a>
                <a href="#electronics">Electronics</a>
                <a href="#e-gift">E-Gift Cards</a>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bottom App and Social Row */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © Fresh Sabji Hub Private Limited, 2016-2026
          </div>
          
          <div className={styles.downloadAppsSection}>
            <span className={styles.downloadLabel}>Download App</span>
            <div className={styles.appBadgeRow}>
              <a href="#playstore" className={styles.appBadge} aria-label="Get it on Google Play">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M3 5.277L14.762 17 3 28.723c-.565-.32-.965-.966-.965-1.804V7.084c0-.838.4-1.484.965-1.807m13.178 10.309l10.218-5.904c.805-.465.805-1.656 0-2.121l-10.218-5.904-1.416 1.416 8.752 5.548-8.752 5.549 1.416 1.416m-1.416 1.414V3.073L3 17.051l11.762-.051m0 0L3 28.723l11.762 2.204V17Z"/>
                </svg>
                <div className={styles.appBadgeText}>
                  <span className={styles.appBadgeSub}>GET IT ON</span>
                  <span className={styles.appBadgeTitle}>Google Play</span>
                </div>
              </a>
              <a href="#appstore" className={styles.appBadge} aria-label="Download on the App Store">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.5-1.34.05-1.77-.76-3.29-.76-1.53 0-2 .73-3.27.79-1.31.05-2.3-1.31-3.14-2.53C4.26 17.06 2.97 12.55 4.72 9.5c.87-1.5 2.43-2.45 4.12-2.5 1.28 0 2.5.9 3.29.9.78 0 2.25-1.1 3.8-1.04.65.04 2.46.26 3.63 1.97-.09.06-2.17 1.27-2.15 3.7.03 2.87 2.44 3.87 2.49 3.87-.02.1-.4 1.4-1.19 3m-2.74-15.33c.66-.8 1.1-1.89.98-3.17-1 .04-2.1 1.06-2.76 1.84-.56.66-1.05 1.76-.9 3.01 1.05.08 2.06-.51 2.68-1.22z"/>
                </svg>
                <div className={styles.appBadgeText}>
                  <span className={styles.appBadgeSub}>Download on the</span>
                  <span className={styles.appBadgeTitle}>App Store</span>
                </div>
              </a>
            </div>
          </div>

          <div className={styles.socialBadgesRow}>
            <a href="#facebook" className={styles.blackSocialBtn} aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
            </a>
            <a href="#twitter" className={styles.blackSocialBtn} aria-label="Twitter">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#instagram" className={styles.blackSocialBtn} aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="#linkedin" className={styles.blackSocialBtn} aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
            <a href="#threads" className={styles.blackSocialBtn} aria-label="Threads">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 12.3c-.29.41-.71.72-1.21.92-.5.2-1.07.3-1.69.3s-1.18-.1-1.69-.3c-.5-.2-.91-.51-1.21-.92-.29-.41-.44-.89-.44-1.43v-.73c0-.54.15-1.02.44-1.43.29-.41.71-.72 1.21-.92.5-.2 1.07-.3 1.69-.3s1.18.1 1.69.3c.5.2.91.51 1.21.92.29.41.44.89.44 1.43v.73c0 .54-.15 1.02-.44 1.43z"/></svg>
            </a>
          </div>
        </div>

        {/* 3. Disclaimer Legal Text */}
        <div className={styles.disclaimerText}>
          "Fresh Sabji Hub" is owned & managed by "Fresh Sabji Hub Private Limited" and is not related, linked or interconnected in whatsoever manner or nature, to "GROFFR.COM" which is a real estate services business operated by "Redstone Consultancy Services Private Limited".
        </div>
      </div>
    </footer>
  );
}
