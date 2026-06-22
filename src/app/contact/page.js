"use client";

import React, { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare, Clock, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import styles from './contact.module.css';

export default function ContactPage() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const dropdownRef = useRef(null);

  const handleEmail = () => {
    window.location.href = 'mailto:support@freshsabjihub.com';
  };

  const handleCall = () => {
    window.location.href = 'tel:+9118004190099';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/9118004190099?text=Hello%20FreshSabjiHub%20Support', '_blank');
  };

  const handleMap = () => {
    const address = '123 Grocery Lane, Fresh Valley, Silicon Valley, CA 94000';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const subjects = [
    'Order & Delivery Issues',
    'Return & Refund Queries',
    'Bulk & Corporate Orders',
    'App & Technical Issues',
    'Payment Queries',
    'Other Inquiry'
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSubjectPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) {
      alert('Please select a subject for your query.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description for your query.');
      return;
    }

    try {
      setLoading(true);
      
      const email = user?.email || '';
      const name = user?.name || '';
      const phone = user?.phone_number || '';

      await api.submitSupportQuery(subject, description, token, email, name, phone);
      
      alert('Your query has been submitted successfully! We will get back to you soon.');
      setDescription('');
      setSubject('');
    } catch (err) {
      alert(err.message || 'Failed to submit support query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Contact Us</h1>
      </div>

      <div className={styles.scrollContainer}>
        {/* Intro Section */}
        <div className={styles.introSection}>
          <h2 className={styles.heading}>We'd Love to Hear From You</h2>
          <p className={styles.paragraph}>
            Our dedicated team is standing by to assist you. Choose your preferred channel to get in touch with us:
          </p>
        </div>

        {/* Contact Methods List */}
        <div className={styles.cardsContainer}>
          {/* WhatsApp Card */}
          <div 
            className={`${styles.contactCard} ${styles.highlightedCard}`} 
            onClick={handleWhatsApp}
          >
            <div className={styles.iconContainer} style={{ backgroundColor: '#E8FBEB' }}>
              <MessageSquare size={22} color="#0f7643" />
            </div>
            <div className={styles.contactDetails}>
              <div className={styles.cardHeaderRow}>
                <span className={styles.contactTitle}>Live WhatsApp Chat</span>
                <div className={styles.badge}>
                  <span className={styles.badgeText}>INSTANT</span>
                </div>
              </div>
              <p className={styles.contactSubtitle}>Best for returns, refunds & order issues</p>
              <span className={styles.actionText}>Start conversation</span>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>

          {/* Call Card */}
          <div className={styles.contactCard} onClick={handleCall}>
            <div className={styles.iconContainer} style={{ backgroundColor: '#FFFBEB' }}>
              <Phone size={22} color="#D97706" />
            </div>
            <div className={styles.contactDetails}>
              <span className={styles.contactTitle}>Call Customer Care</span>
              <p className={styles.contactSubtitle}>Speak directly with our support team</p>
              <p className={styles.contactValue}>+91 1800-419-0099</p>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>

          {/* Email Card */}
          <div className={styles.contactCard} onClick={handleEmail}>
            <div className={styles.iconContainer} style={{ backgroundColor: '#EFF6FF' }}>
              <Mail size={22} color="#2563EB" />
            </div>
            <div className={styles.contactDetails}>
              <span className={styles.contactTitle}>Email Support</span>
              <p className={styles.contactSubtitle}>For bulk orders & corporate feedback</p>
              <p className={styles.contactValue}>support@freshsabjihub.com</p>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>

          {/* Head Office Card */}
          <div className={styles.contactCard} onClick={handleMap}>
            <div className={styles.iconContainer} style={{ backgroundColor: '#F1F5F9' }}>
              <MapPin size={22} color="#64748b" />
            </div>
            <div className={styles.contactDetails}>
              <span className={styles.contactTitle}>Corporate Office</span>
              <p className={styles.contactSubtitle}>Silicon Valley, CA 94000</p>
              <p className={styles.contactValue}>123 Grocery Lane, Fresh Valley</p>
            </div>
            <ChevronRight size={18} color="#64748b" />
          </div>
        </div>

        {/* Operating Hours Banner */}
        <div className={styles.hoursBanner}>
          <Clock size={20} className={styles.hoursIcon} />
          <div className={styles.hoursContent}>
            <h3 className={styles.hoursTitle}>Operating Hours</h3>
            <p className={styles.hoursText}>
              Phone lines are active daily from <span className={styles.boldText}>6:00 AM to 11:00 PM</span>. Inquiries sent via Email or WhatsApp outside these hours will be handled first thing in the morning.
            </p>
          </div>
        </div>

        {/* Support Query Form */}
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>Send Us a Message</h3>

          <div className={styles.inputGroup} ref={dropdownRef}>
            <span className={styles.fieldLabel}>What is your query related to? *</span>
            <div
              className={`${styles.pickerSelector} ${showSubjectPicker ? styles.pickerSelectorActive : ''}`}
              onClick={() => setShowSubjectPicker(!showSubjectPicker)}
            >
              <span className={`${styles.pickerSelectorText} ${!subject ? styles.placeholderText : ''}`}>
                {subject || 'Select a subject...'}
              </span>
              <ChevronDown size={18} color="#64748b" />
            </div>
            
            {showSubjectPicker && (
              <div className={styles.dropdownContainer}>
                {subjects.map((item) => (
                  <div
                    key={item}
                    className={`${styles.dropdownItem} ${subject === item ? styles.selectedDropdownItem : ''}`}
                    onClick={() => {
                      setSubject(item);
                      setShowSubjectPicker(false);
                    }}
                  >
                    <span className={`${styles.dropdownItemText} ${subject === item ? styles.selectedDropdownItemText : ''}`}>
                      {item}
                    </span>
                    {subject === item && <Check size={16} color="#0f7643" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel} htmlFor="query-desc">Describe your query *</label>
            <textarea
              id="query-desc"
              className={`${styles.textInput} styles.multilineInput`}
              placeholder="Describe details of your query or issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${loading ? styles.submitButtonDisabled : ''}`}
            disabled={loading}
          >
            {loading ? (
              <div className={styles.spinner} />
            ) : (
              "Send Message"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
