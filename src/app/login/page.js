"use client";

import React, { useState, useContext, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '../../components/SafeImage';
import { AuthContext } from '../../context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useContext(AuthContext);

  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  // References for OTP input fields to auto-focus next
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile');
    }
  }, [isAuthenticated, router]);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSendOTP = () => {
    if (phone.length !== 10) return;
    setOtpMode(true);
  };

  const handleOtpDigitChange = (index, value) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = sanitized;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (sanitized && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const otpCode = otpDigits.join('');
    if (otpCode !== '1234') {
      alert('Incorrect verification code. Please enter 1234.');
      return;
    }

    setLoading(true);

    try {
      const mockUser = {
        id: 'mock_user_' + phone,
        name: 'Guest User',
        phone_number: phone,
        email: `${phone}@freshsabjihub.com`,
        profile_picture_url: ''
      };
      const mockToken = 'mock_jwt_token_' + Date.now();

      // Update AuthContext session
      login(mockUser, mockToken);
      
      // Navigate to profile
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPhoneValid = phone.length === 10;
  const isOtpValid = otpDigits.join('').length === 4;

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
            <label className={styles.inputLabel}>Enter Mobile Number</label>
            <input
              type="tel"
              className={styles.inputField}
              placeholder="Enter your 10-digit mobile number"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
            />
            <button
              className={styles.continueBtn}
              onClick={handleSendOTP}
              disabled={!isPhoneValid || loading}
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className={styles.formSection}>
            <label className={styles.inputLabel}>Enter 4-Digit OTP</label>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '-4px', marginBottom: '16px' }}>
              We've generated a verification code for <strong>+91 {phone}</strong>. Use <strong>1234</strong> for testing.
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
                />
              ))}
            </div>

            <button
              className={styles.continueBtn}
              onClick={handleVerifyOTP}
              disabled={!isOtpValid || loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              className={styles.changePhoneBtn}
              onClick={() => {
                setOtpMode(false);
                setOtpDigits(['', '', '', '']);
              }}
            >
              ← Change Phone Number
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
