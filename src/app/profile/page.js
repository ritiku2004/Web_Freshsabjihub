"use client";

import React, { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  MapPin,
  Share2,
  Info,
  PhoneCall,
  Lock,
  FileText,
  LogOut,
  ChevronRight,
  X,
  Edit2,
  Camera,
  ArrowLeft,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../services/api';
import SafeImage from '../../components/SafeImage';
import Loader from '../../components/Loader';
import styles from './profile.module.css';

import { API_BASE_URL } from '../../services/api';

const resolveAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/') || url.startsWith('uploads/')) {
    const base = API_BASE_URL.replace('/api/v1', '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return null;
};

const ABOUT_CONTENT = `FreshCart is a modern grocery delivery platform designed to bring fresh vegetables, daily utilities, pantry goods, snacks, and sweet desserts to your doorstep quickly.

Founded with a vision to streamline household supplies, we coordinate with local farmers and micro-warehouses to maintain premium quality checks and cold chain logistics. Thank you for choosing us!`;

const CONTACT_CONTENT = `Need help with an active order or have feedback for our team? Reach out to us:

📧 Email Support: support@freshsabjihub.com
📞 Phone Support: +91 1800-419-0099
🕒 Operating Hours: 6:00 AM - 11:00 PM (All days)

We aim to resolve all email inquiries within 2 hours.`;

const PRIVACY_CONTENT = `At FreshCart, we prioritize your personal privacy. We collect basic details such as your phone number, name, and delivery addresses to fulfill orders and process transactions.

We encrypt transaction data via Secure Sockets Layer (SSL) and utilize local storage for secure session configurations. We do not sell your personal data to third parties. For complete terms, visit freshcart.com/privacy.`;

const TERMS_CONTENT = `By accessing and placing orders on FreshCart, you agree to comply with our delivery parameters:

1. Delivery Slot Targets: While we aim for quick delivery, ETA estimates may fluctuate during heavy rain or festival hours.
2. Order Cancellation: Orders cannot be cancelled once they transition to the "Out for Delivery" status.
3. Pricing & Taxes: Bill summaries incorporate local GST taxes, delivery partner tipping allowances, and flat packaging fees.`;

const PRESET_AVATARS = [
  { emoji: '🍅', color: '#FEE2E2', label: 'Tomato' },
  { emoji: '🥦', color: '#D1FAE5', label: 'Broccoli' },
  { emoji: '🥕', color: '#FFEDD5', label: 'Carrot' },
  { emoji: '🥑', color: '#E0F2FE', label: 'Avocado' },
  { emoji: '🍓', color: '#FFF1F2', label: 'Strawberry' },
  { emoji: '🍋', color: '#FEF9C3', label: 'Lemon' },
  { emoji: '🍇', color: '#F3E8FF', label: 'Grapes' },
  { emoji: '🍉', color: '#ECFDF5', label: 'Watermelon' },
  { emoji: '🍎', color: '#FEF2F2', label: 'Apple' },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { user, logout, updateUser, activeAddress, token, serviceAvailable, activeShop, isAuthenticated, refreshProfile } = useContext(AuthContext);

  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!storedToken || !storedUser) {
        router.replace('/login');
      } else {
        setLoadingAuth(false);
        refreshProfile();
      }
    }
  }, [router, refreshProfile]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetails, setModalDetails] = useState({ title: '', content: '' });

  // Edit Profile States
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  const handleShareApp = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Fresh Sabji Hub',
          text: 'Download FreshCart now! Get fresh groceries delivered to your home quickly.',
          url: 'https://play.google.com/store/apps/freshcart',
        });
      } else {
        await navigator.clipboard.writeText('Download FreshCart now! PlayStore link: https://play.google.com/store/apps/freshcart');
        alert('Share message copied to clipboard!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of your session?')) {
      await logout();
      router.push('/');
    }
  };

  const openInfoModal = (title, content) => {
    setModalDetails({ title, content });
    setModalVisible(true);
  };

  const handleOpenEditProfile = () => {
    const currentName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '');
    setEditName(currentName);
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone_number || '');
    setSelectedAvatar(user?.profile_picture_url || '');
    setEditProfileVisible(true);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePickImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUpdating(true);
      const uploadedUrl = await api.uploadAvatar(file);
      setSelectedAvatar(uploadedUrl);
      
      const newUserData = {
        ...user,
        profile_picture_url: uploadedUrl
      };
      updateUser(newUserData);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    if (editEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editEmail.trim())) {
        alert('Please enter a valid email address');
        return;
      }
    }

    if (editPhone.trim()) {
      if (editPhone.trim().length < 10) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }
    }

    try {
      setIsUpdating(true);
      const updatedUser = await api.updateProfile(
        editName.trim(),
        editEmail.trim() || null,
        editPhone.trim() || null,
        selectedAvatar || null
      );

      const newUserData = {
        ...user,
        ...updatedUser,
        name: editName.trim(),
        phone_number: editPhone.trim() || null,
        profile_picture_url: selectedAvatar || null
      };

      updateUser(newUserData);
      setEditProfileVisible(false);
    } catch (e) {
      alert(e.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loadingAuth) {
    return <Loader text="Loading Profile..." />;
  }

  const displayName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || 'Guest User';

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const avatarUri = resolveAvatarUrl(user?.profile_picture_url || selectedAvatar);
  const isCustomUrl = !!avatarUri;
  const hasEmojiAvatar = user?.profile_picture_url && PRESET_AVATARS.some((a) => a.emoji === user.profile_picture_url);
  const activeAvatarColor = user?.profile_picture_url
    ? PRESET_AVATARS.find((a) => a.emoji === user.profile_picture_url)?.color || '#10b981'
    : '#10b981';

  return (
    <div className={styles.profilePage}>
      {/* Profile Banner */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className={styles.pageTitle}>My Profile</h1>
      </div>

      <div className={styles.pageContent}>
        {/* User Information Card */}
        <div className={styles.profileCard}>
          <div
            onClick={handleOpenEditProfile}
            className={styles.avatarWrapper}
            onMouseEnter={() => setIsAvatarHovered(true)}
            onMouseLeave={() => setIsAvatarHovered(false)}
          >
            <div className={`${styles.avatarContainer} ${isAvatarHovered ? styles.avatarContainerHovered : ''}`} style={{ backgroundColor: activeAvatarColor }}>
              {isCustomUrl ? (
                <SafeImage
                  src={avatarUri}
                  alt={displayName}
                  className={styles.avatarImage}
                  style={{ opacity: isAvatarHovered ? 0.5 : 1 }}
                />
              ) : hasEmojiAvatar ? (
                <span className={styles.avatarEmoji} style={{ opacity: isAvatarHovered ? 0.5 : 1 }}>{user.profile_picture_url}</span>
              ) : (
                <span className={styles.avatarText} style={{ opacity: isAvatarHovered ? 0.5 : 1 }}>{userInitials}</span>
              )}
              {isAvatarHovered && (
                <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={20} color="#FFF" />
                </div>
              )}
            </div>
            <div className={styles.cameraIconOverlay}>
              <Camera size={11} color="#FFF" />
            </div>
          </div>

          <div className={styles.profileDetails}>
            <div className={styles.detailsHeader}>
              <div>
                <h4 className={styles.userName}>{displayName}</h4>
                <p className={styles.userEmail}>{user?.email || 'No email added'}</p>
                {user?.phone_number && (
                  <p className={styles.userPhone}>{user.phone_number}</p>
                )}
              </div>
              <button onClick={handleOpenEditProfile} className={styles.editProfileBtn} title="Edit Profile">
                <Edit2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className={styles.menuContainer}>
          {/* Address Book */}
          <button className={styles.menuItem} onClick={() => router.push('/addresses')}>
            <div className={styles.menuItemLeft}>
              <MapPin size={20} />
              <span className={styles.menuItemText}>Address Book</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>

          {/* Share App */}
          <button className={styles.menuItem} onClick={handleShareApp}>
            <div className={styles.menuItemLeft}>
              <Share2 size={20} />
              <span className={styles.menuItemText}>Share App</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>

          {/* About Us */}
          <button className={styles.menuItem} onClick={() => router.push('/about')}>
            <div className={styles.menuItemLeft}>
              <Info size={20} />
              <span className={styles.menuItemText}>About Us</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>

          {/* Contact Us */}
          <button className={styles.menuItem} onClick={() => router.push('/contact')}>
            <div className={styles.menuItemLeft}>
              <PhoneCall size={20} />
              <span className={styles.menuItemText}>Contact Us</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>

          {/* Privacy Policy */}
          <button className={styles.menuItem} onClick={() => router.push('/privacy')}>
            <div className={styles.menuItemLeft}>
              <Lock size={20} />
              <span className={styles.menuItemText}>Privacy Policy</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>

          {/* Terms & Conditions */}
          <button className={styles.menuItem} onClick={() => router.push('/terms')}>
            <div className={styles.menuItemLeft}>
              <FileText size={20} />
              <span className={styles.menuItemText}>Terms & Conditions</span>
            </div>
            <ChevronRight size={18} className={styles.chevronRight} />
          </button>
        </div>

        {/* Log Out */}
        <button className={styles.logoutButton} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {/* Static Info Display Modal */}
      {modalVisible && (
        <div className={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{modalDetails.title}</h3>
              <button className={styles.modalCloseBtn} onClick={() => setModalVisible(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalScrollContent}>
              <p className={styles.modalBodyText}>{modalDetails.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfileVisible && (
        <div className={styles.modalOverlay} onClick={() => setEditProfileVisible(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile</h3>
              <button className={styles.modalCloseBtn} onClick={() => setEditProfileVisible(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalScrollContent}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div onClick={triggerFileSelect} style={{ position: 'relative', cursor: 'pointer' }}>
                  <div className={styles.avatarContainer} style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: selectedAvatar && PRESET_AVATARS.some(a => a.emoji === selectedAvatar)
                      ? PRESET_AVATARS.find(a => a.emoji === selectedAvatar).color
                      : '#10b981',
                    fontSize: '28px'
                  }}>
                    {resolveAvatarUrl(selectedAvatar) ? (
                      <SafeImage
                        src={resolveAvatarUrl(selectedAvatar)}
                        alt="Avatar Preview"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : selectedAvatar ? (
                      <span>{selectedAvatar}</span>
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>
                  <div className={styles.cameraIconOverlay} style={{ bottom: '0', right: '0', width: '28px', height: '28px', borderWidth: '3px' }}>
                    <Camera size={13} color="#FFF" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePickImage}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontWeight: '600' }}>
                  Tap camera to upload custom photo
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Enter your name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="Enter your email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  placeholder="Enter your phone number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={10}
                />
              </div>

              <label className={styles.avatarPickerLabel}>Choose Your Organic Avatar</label>
              <div className={styles.avatarOptionsList}>
                <button
                  className={`${styles.avatarOption} ${!selectedAvatar ? styles.selectedAvatarOption : ''}`}
                  style={{ backgroundColor: '#E5E7EB' }}
                  onClick={() => setSelectedAvatar('')}
                >
                  <span className={styles.avatarOptionNoneText}>None</span>
                </button>

                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar.label}
                    className={`${styles.avatarOption} ${selectedAvatar === avatar.emoji ? styles.selectedAvatarOption : ''}`}
                    style={{ backgroundColor: avatar.color }}
                    onClick={() => setSelectedAvatar(avatar.emoji)}
                  >
                    <span>{avatar.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setEditProfileVisible(false)}
                className={styles.cancelBtn}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className={styles.saveBtn}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
