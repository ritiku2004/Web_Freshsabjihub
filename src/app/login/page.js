"use client";

import React, { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '../../components/SafeImage';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  // References for OTP input fields to auto-focus next
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/profile');
    }
  }, [isAuthenticated, router]);

  const validateEmail = (emailStr) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(emailStr);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) return;
    setLoading(true);
    try {
      await api.sendOtp(email.trim().toLowerCase());
      setOtpMode(true);
    } catch (err) {
      alert(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = sanitized;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (sanitized && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) return;

    setLoading(true);

    try {
      const response = await api.verifyOtp(email.trim().toLowerCase(), otpCode);
      // Response contains { user, token }
      await login(response.user, response.token);
      router.replace('/profile');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = validateEmail(email);
  const isOtpValid = otpDigits.join('').length === 6;

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* Brand/Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <SafeImage src="/logo.png" alt="Logo" className={styles.logoImage} />
          </div>
          <h2 className={styles.brandTitle}>FreshCart</h2>
          <p className={styles.brandSubtitle}>Fresh groceries delivered to you</p>
        </div>

        {/* Input Form Section */}
        {!otpMode ? (
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Enter Email Address</label>
            <input
              type="email"
              className={styles.inputField}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="email"
            />
            <button
              className={styles.continueBtn}
              onClick={handleSendOTP}
              disabled={!isEmailValid || loading}
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Enter 6-Digit OTP</label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '-4px', marginBottom: '16px' }}>
              We've sent a verification code to <strong>{email}</strong>.
            </p>
            
            <div className={styles.otpRow}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  className={styles.otpInput}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  style={{ width: '40px', height: '40px', fontSize: '18px', textAlign: 'center', margin: '0 4px' }}
                />
              ))}
            </div>

            <button
              className={styles.continueBtn}
              onClick={handleVerifyOTP}
              disabled={!isOtpValid || loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              className={styles.changePhoneBtn}
              onClick={() => {
                setOtpMode(false);
                setOtpDigits(['', '', '', '', '', '']);
              }}
            >
              ← Change Email Address
            </button>
          </div>
        )}

        {/* Privacy Terms Note */}
        <p className={styles.footerText}>
          By continuing, you agree to our{' '}
          <span className={styles.accentLink}>Terms of Service</span>
          {' '}&{' '}
          <span className={styles.accentLink}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
