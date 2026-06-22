"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  User,
  Smartphone,
  ShoppingBag,
  RotateCcw,
  Copyright,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import styles from './terms.module.css';

export default function TermsPage() {
  const router = useRouter();

  const termsList = [
    {
      id: 1,
      title: "1. Acceptance of Terms",
      icon: <BookOpen size={20} />,
      content: "By downloading, accessing, or using the FreshCart application (\"App\"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access or use our services."
    },
    {
      id: 2,
      title: "2. User Accounts",
      icon: <User size={20} />,
      content: "To place orders, you must create a verified account. You are responsible for safeguarding your login credentials (including OTP tokens sent to your email) and for all activities that occur under your profile."
    },
    {
      id: 3,
      title: "3. Use of the App",
      icon: <Smartphone size={20} />,
      content: "You agree to use the App only for lawful, personal purposes. Violations or attempts to violate app security, including accessing unauthorized accounts or data scraping, will result in immediate termination."
    },
    {
      id: 4,
      title: "4. Orders, Pricing & Delivery",
      icon: <ShoppingBag size={20} />,
      content: "All product prices are subject to change without notice. Delivery timelines are estimates, and while we strive to meet them, FreshCart is not liable for minor delays outside our control (e.g. extreme weather or transit conditions)."
    },
    {
      id: 5,
      title: "5. Returns & Refunds",
      icon: <RotateCcw size={20} />,
      content: "If you receive incorrect, damaged, or defective items, you must contact our customer support team within 24 hours of delivery. Refunds or replacements are issued at our sole discretion after proper verification."
    },
    {
      id: 6,
      title: "6. Intellectual Property",
      icon: <Copyright size={20} />,
      content: "The App and its original content, features, and brand design are the exclusive property of FreshCart and its licensors. Any reuse or duplication of assets is strictly prohibited without prior written consent."
    },
    {
      id: 7,
      title: "7. Limitation of Liability",
      icon: <AlertTriangle size={20} />,
      content: "In no event shall FreshCart, its directors, partners, or employees be liable for any indirect, incidental, or special damages resulting from your use of the App or inability to access the service."
    },
    {
      id: 8,
      title: "8. Changes to Terms",
      icon: <Clock size={20} />,
      content: "We reserve the right to modify or replace these Terms at any time. By continuing to access or use our App after revisions become effective, you agree to be bound by the updated terms."
    }
  ];

  return (
    <div className={styles.termsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Terms & Conditions</h1>
      </div>

      {/* Main Content */}
      <div className={styles.pageContent}>
        {/* Summary Banner */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIconWrap}>
            <BookOpen size={20} />
          </div>
          <div className={styles.summaryInfo}>
            <h2 className={styles.summaryTitle}>Terms of Service Summary</h2>
            <p className={styles.summaryDesc}>
              By using FreshCart, you agree to our service terms. Below are the key terms regarding your account, orders, delivery, and refunds.
            </p>
          </div>
        </div>

        {/* Title & Effective Date */}
        <div className={styles.mainTitleSec}>
          <h2 className={styles.mainTitle}>FreshCart Terms of Service</h2>
          <p className={styles.effectiveDate}>Effective Date: June 2026</p>
        </div>

        {/* Terms list */}
        <div className={styles.termsList}>
          {termsList.map((term) => (
            <div key={term.id} className={styles.termCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  {term.icon}
                </div>
                <h3 className={styles.cardTitle}>{term.title}</h3>
              </div>
              <p className={styles.cardContent}>{term.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
