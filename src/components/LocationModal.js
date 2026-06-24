"use client";

import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import styles from './LocationModal.module.css';

export default function LocationModal({ isOpen, onClose }) {
  const { addresses, activeAddress, setActiveAddressById, saveAddress } = useContext(AuthContext);
  const [zipcodeInput, setZipcodeInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [type, setType] = useState('Home');
  const [flatNo, setFlatNo] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');

  if (!isOpen) return null;

  const handleZipcodeSubmit = (e) => {
    e.preventDefault();
    if (!zipcodeInput.trim()) return;

    // Create a temporary address with the zipcode to check availability
    const mockAddr = {
      id: 'temp_zip_' + Date.now(),
      type: 'Other',
      flatNo: 'Zipcode Check',
      addressLine: `Zipcode: ${zipcodeInput}`,
      landmark: '',
      receiverName: 'Guest',
      receiverMobile: '',
      zipcode: zipcodeInput,
      latitude: 28.6289,
      longitude: 77.3801,
    };
    saveAddress(mockAddr);
    setActiveAddressById(mockAddr.id);
    setZipcodeInput('');
    onClose();
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!flatNo || !addressLine || !receiverName || !receiverMobile) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    const newAddr = {
      type,
      flatNo,
      addressLine,
      landmark,
      receiverName,
      receiverMobile,
      latitude: 28.6289,
      longitude: 77.3801,
    };
    
    saveAddress(newAddr);
    setShowAddForm(false);
    setFormError('');
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Choose your location</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {!showAddForm ? (
          <div className={styles.body}>
            <p className={styles.subtitle}>Select a delivery address or enter a zipcode to see items available in your area.</p>

            <form onSubmit={handleZipcodeSubmit} className={styles.zipcodeForm}>
              <input
                type="text"
                placeholder="Enter 6-digit zipcode (e.g. 10001)"
                value={zipcodeInput}
                onChange={(e) => setZipcodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={styles.zipcodeInput}
              />
              <button type="submit" className={styles.zipcodeBtn}>Check</button>
            </form>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <div className={styles.addressList}>
              <h3>Saved Addresses</h3>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`${styles.addressCard} ${activeAddress?.id === addr.id ? styles.activeCard : ''}`}
                  onClick={() => {
                    setActiveAddressById(addr.id);
                    onClose();
                  }}
                >
                  <div className={styles.addressHeader}>
                    <span className={styles.addressTypeBadge}>{addr.type}</span>
                    {activeAddress?.id === addr.id && <span className={styles.selectedTick}>✓ Delivering Here</span>}
                  </div>
                  <p className={styles.addressDetails}>
                    {addr.flatNo}, {addr.addressLine}
                  </p>
                  {addr.landmark && <p className={styles.landmark}>Landmark: {addr.landmark}</p>}
                  <p className={styles.receiver}>
                    {addr.receiverName} • {addr.receiverMobile}
                  </p>
                </div>
              ))}
            </div>

            <button className={styles.addNewBtn} onClick={() => setShowAddForm(true)}>
              + Add New Address
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddAddress} className={styles.addForm}>
            <div className={styles.formBody}>
              <h3>Add Delivery Address</h3>
              {formError && <p className={styles.errorText}>{formError}</p>}

              <div className={styles.formGroup}>
                <label>Address Type</label>
                <div className={styles.typeSelector}>
                  {['Home', 'Office', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.typeBtn} ${type === t ? styles.activeTypeBtn : ''}`}
                      onClick={() => setType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Flat/House No. (Required)"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Street/Sector Address (Required)"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  placeholder="Receiver's Name (Required)"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="tel"
                  placeholder="Receiver's Mobile Number (Required)"
                  value={receiverMobile}
                  onChange={(e) => setReceiverMobile(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                Back
              </button>
              <button type="submit" className={styles.saveBtn}>
                Save Address
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
