"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, ShieldCheck, Eye, Share2, FileText, Mail, UserCheck } from 'lucide-react';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const router = useRouter();

  const handleEmailClick = () => {
    window.location.href = 'mailto:security@freshsabjihub.com';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Privacy Policy</h1>
      </div>

      <div className={styles.scrollContainer}>
        {/* Trust Header Banner */}
        <div className={styles.trustBanner}>
          <div className={styles.trustIconContainer}>
            <ShieldCheck size={26} color="#059669" />
          </div>
          <div className={styles.trustContent}>
            <h3 className={styles.trustTitle}>Your Privacy is Our Priority</h3>
            <p className={styles.trustText}>
              We encrypt all transactions, never sell your data, and use industry-standard protocols to safeguard your info.
            </p>
          </div>
        </div>

        {/* Effective Date */}
        <div className={styles.introContainer}>
          <h2 className={styles.heading}>FreshCart Privacy Policy</h2>
          <p className={styles.date}>Effective Date: June 2026</p>
        </div>

        {/* Card list */}
        <div className={styles.cardsContainer}>

          {/* Section 1 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <FileText size={20} />
              <h3 className={styles.cardTitle}>1. Introduction</h3>
            </div>
            <p className={styles.cardBody}>
              Welcome to FreshCart ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This policy covers all information collected through our mobile application, and any related delivery, marketing, or customer services.
            </p>
          </div>

          {/* Section 2 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <Eye size={20} />
              <h3 className={styles.cardTitle}>2. Information We Collect</h3>
            </div>
            <p className={styles.cardBody}>
              We collect information you voluntarily provide (name, email, phone number, address) when setting up your profile or checking out. 
              <br/><br/>
              <b>Location Information:</b> We request access to your device's precise location (GPS) to accurately deliver your groceries and autofill your address. Location data is only used during active order fulfillment.
              <br/><br/>
              <b>Notifications:</b> We ask for notification permissions to send you real-time updates regarding your order status and delivery ETA.
            </p>
          </div>

          {/* Section 3 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <Lock size={20} />
              <h3 className={styles.cardTitle}>3. How We Use Your Data</h3>
            </div>
            <p className={styles.cardBody}>
              We use personal information to:
            </p>
            <div className={styles.bulletList}>
              <span className={styles.bulletItem}>• Securely authenticate and manage your login sessions.</span>
              <span className={styles.bulletItem}>• Process, pack, and deliver your grocery orders.</span>
              <span className={styles.bulletItem}>• Send automated delivery notifications and real-time support status.</span>
              <span className={styles.bulletItem}>• Review feedback and resolve active support inquiries.</span>
            </div>
          </div>

          {/* Section 4 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <Share2 size={20} />
              <h3 className={styles.cardTitle}>4. Information Sharing</h3>
            </div>
            <p className={styles.cardBody}>
              We only share your information with your direct consent, to comply with legal authorities, or to execute logistics (e.g. sharing delivery addresses with drivers and processing card payments). We never sell your details to advertising networks.
            </p>
          </div>

          {/* Section 5 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <ShieldCheck size={20} />
              <h3 className={styles.cardTitle}>5. Data Security & Retention</h3>
            </div>
            <p className={styles.cardBody}>
              We employ strict physical, electronic, and administrative controls. We retain your customer details only for as long as your account is active or as necessary to comply with tax and audit regulations.
            </p>
          </div>

          {/* Section 6 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <UserCheck size={20} />
              <h3 className={styles.cardTitle}>6. Your Rights</h3>
            </div>
            <p className={styles.cardBody}>
              You hold the right to view, modify, or delete your personal details. You can update your profile parameters, address, and preferences, or request account deletion at any time directly through the Profile panel in the app. Data updates are synced immediately across both our mobile app and website.
            </p>
          </div>

          {/* Section 7 */}
          <div className={styles.policyCard}>
            <div className={styles.cardHeader}>
              <Mail size={20} />
              <h3 className={styles.cardTitle}>7. Contact Us</h3>
            </div>
            <p className={styles.cardBody}>
              Have questions, concerns, or requests regarding this policy? Reach out directly to our Data Protection Officer:
            </p>
            <button 
              onClick={handleEmailClick}
              className={styles.emailLinkButton}
            >
              <Mail size={16} color="#0f7643" />
              <span className={styles.emailLinkText}>security@freshsabjihub.com</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
