"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sprout, ShieldCheck, Award, Smile, Clock, Heart, Zap } from 'lucide-react';
import SafeImage from '../../components/SafeImage';
import styles from './about.module.css';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className={styles.aboutPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>About Us</h1>
      </div>

      <div className={styles.pageContent}>
        <div className={styles.contentCard}>
          {/* Hero Banner Section */}
          <div className={styles.heroSection}>
            <div className={styles.logoOuterCircle}>
              <div className={styles.logoInnerCircle}>
                <SafeImage src="/logo.png" alt="FreshCart Logo" className={styles.logoImage} />
              </div>
            </div>
            <h2 className={styles.heroTitle}>FreshCart</h2>
            <p className={styles.heroSubtitle}>Nourishing Lives, Freshly & Fast</p>
            <div className={styles.badgeContainer}>
              <span className={styles.badgeText}>100% ORGANIC PROMISE</span>
            </div>
          </div>

          {/* Intro */}
          <div className={styles.section}>
            <h3 className={styles.welcomeText}>Welcome to the Future of Grocery</h3>
            <p className={styles.paragraph}>
              At FreshCart, we believe that access to clean, fresh, and nutritious food is a fundamental right. We are rewriting the rules of the grocery supply chain to bring farm-fresh produce and daily household essentials straight to your home.
            </p>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <Smile size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>50K+</span>
              <span className={styles.statLabel}>Happy Users</span>
            </div>
            <div className={styles.statCard}>
              <Clock size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>15 Min</span>
              <span className={styles.statLabel}>Avg Delivery</span>
            </div>
            <div className={styles.statCard}>
              <Sprout size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>150+</span>
              <span className={styles.statLabel}>Partner Farms</span>
            </div>
            <div className={styles.statCard}>
              <Award size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Quality Check</span>
            </div>
          </div>

          {/* Pillars Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Our Core Pillars</h3>
            
            {/* Pillar 1 */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconContainer}>
                <Sprout size={22} />
              </div>
              <div className={styles.pillarContent}>
                <h4 className={styles.pillarTitle}>Direct From Local Farms</h4>
                <p className={styles.pillarDescription}>
                  We partner directly with regional growers and local micro-warehouses to maintain premium quality checks and skip middleman delays.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconContainer}>
                <Zap size={22} />
              </div>
              <div className={styles.pillarContent}>
                <h4 className={styles.pillarTitle}>Hyperlocal & Superfast</h4>
                <p className={styles.pillarDescription}>
                  Our cold-chain logistics system keeps temperature-controlled bags optimized so items arrive fresh and fast.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconContainer}>
                <ShieldCheck size={22} />
              </div>
              <div className={styles.pillarContent}>
                <h4 className={styles.pillarTitle}>Absolute Safety First</h4>
                <p className={styles.pillarDescription}>
                  Multi-layer disinfection, touchless packing, and continuous sanitization protocols ensure total safety from farm to fork.
                </p>
              </div>
            </div>
          </div>

          {/* Promise Card */}
          <div className={styles.promiseCard}>
            <div className={styles.promiseContent}>
              <Heart size={32} className={styles.promiseIcon} />
              <h3 className={styles.promiseTitle}>Our Green Commitment</h3>
              <p className={styles.promiseDescription}>
                We are dedicated to sustainable delivery. Over 90% of our packaging is biodegradable, and we actively work with our delivery network to minimize our carbon footprint.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p className={styles.footerText}>Version 1.0.0</p>
            <p className={styles.footerSubtext}>Proudly serving healthy living</p>
            <p className={styles.footerHeart}>Made with 💚 for fresh eating</p>
          </div>
        </div>
      </div>
    </div>
  );
}
