"use client";

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, MapPin, AlertTriangle, CheckCircle, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import SafeImage from '../../components/SafeImage';
import Loader from '../../components/Loader';
import { api } from '../../services/api';
import { MOCK_CATEGORIES } from '../data';
import styles from '../page.module.css';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, token, user, activeAddress, serviceAvailable, activeShop, loading } = useContext(AuthContext);
  const {
    cartItems,
    cartSubtotal,
    cartSavings,
    deliveryFee,
    handlingFee,
    cartGrandTotal,
    freeDeliveryThreshold,
    freeHandlingThreshold,
    updateQuantity,
    clearCart
  } = useContext(CartContext);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', activeShop?.id],
    queryFn: () => api.getCategories(activeShop?.id),
    enabled: !!activeAddress && !!serviceAvailable && !!activeShop?.id,
  });

  const [driverTip, setDriverTip] = useState(0);
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  const [customTipInput, setCustomTipInput] = useState('');

  const finalTotal = Math.round((cartGrandTotal + driverTip) * 100) / 100;

  // Calculate promo message
  let promoMessage = null;
  const distDelivery = freeDeliveryThreshold > 0 ? freeDeliveryThreshold - cartSubtotal : 0;
  const distHandling = freeHandlingThreshold > 0 ? freeHandlingThreshold - cartSubtotal : 0;

  if (cartItems.length > 0) {
    if (distDelivery > 0 && distHandling > 0) {
      if (distDelivery <= distHandling) {
        promoMessage = `Add ₹${distDelivery} more for free delivery!`;
      } else {
        promoMessage = `Add ₹${distHandling} more for free handling!`;
      }
    } else if (distDelivery > 0) {
      promoMessage = `Add ₹${distDelivery} more for free delivery!`;
    } else if (distHandling > 0) {
      promoMessage = `Add ₹${distHandling} more for free handling!`;
    }
  }

  if (loading) {
    return <Loader />;
  }

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <MapPin size={48} color="#64748b" />
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select or add a saved address to check serviceability and browse products.
        </p>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className={styles.emptyStateContainer}>
        <AlertTriangle size={48} color="#ef4444" />
        <h2 className={styles.emptyStateTitle}>No Service Available</h2>
        <p className={styles.emptyStateText}>
          We currently do not support delivery to your selected location. Please select or add a different address.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      {cartItems.length === 0 ? (
        <div className={styles.emptyCartScreen}>
          {/* Visual empty cart container */}
          <div className={styles.emptyCartVisual}>
            <div className={styles.emptyCartCircle}>
              <ShoppingBag size={42} className={styles.emptyCartBagIcon} />
              <div className={styles.sparkleBadge}>
                <Sparkles size={12} className={styles.sparkleIcon} />
              </div>
            </div>
            <h2 className={styles.emptyCartTitle}>Your cart is empty</h2>
            <p className={styles.emptyCartDescription}>
              Add items to your cart to experience fast delivery at your doorstep!
            </p>
            <button className={styles.startShoppingBtn} onClick={() => router.push('/')}>
              <span>Start Shopping</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Shop Popular Categories section */}
          <div className={styles.popularCategoriesHeader} onClick={() => router.push('/categories')}>
            <h3>Shop Popular Categories</h3>
            <ChevronRight size={18} className={styles.popularChevron} />
          </div>

          <div className={styles.popularCategoriesRow}>
            {isLoadingCategories ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={`loader-${idx}`} className={styles.popularCategoryCard} style={{ opacity: 0.6 }}>
                  <div className={styles.popularCategoryCircle} style={{ background: '#e5e7eb', animation: 'pulse 1.5s infinite' }}></div>
                  <div style={{ height: '10px', width: '60px', background: '#e5e7eb', marginTop: '8px', borderRadius: '4px', animation: 'pulse 1.5s infinite', marginInline: 'auto' }}></div>
                </div>
              ))
            ) : (
              (categories.length > 0 ? categories : MOCK_CATEGORIES).map((cat) => (
                <div
                  key={cat.id}
                  className={styles.popularCategoryCard}
                  onClick={() => router.push(`/categories?cat=${cat.id}`)}
                >
                  <div className={styles.popularCategoryCircle}>
                    <SafeImage
                      src={cat.image}
                      alt={cat.name}
                      className={styles.popularCategoryImage}
                    />
                  </div>
                  <span className={styles.popularCategoryName}>{cat.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={styles.cartLayout}>
          {/* Cart Items List */}
          <div className={styles.cartItemsList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItemRow}>
                <div className={styles.cartItemLeft}>
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className={item.image ? styles.cartItemImage : ''}
                  />
                  <div className={styles.cartItemDetails}>
                    <h4>{item.name}</h4>
                    <span className={styles.cartItemMeta}>{item.unit}</span>
                    <div className={styles.cartItemPriceRow}>
                      <span className={styles.cartItemPrice}>₹{item.discountPrice}</span>
                      {item.discountPrice < item.price && (
                        <span className={styles.cartItemOriginalPrice}>₹{item.price}</span>
                      )}
                      <span className={styles.cartItemQtyLabel}>&times; {item.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cartItemRight}>
                  <div className={styles.quantityChanger}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className={styles.quantityText}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    onClick={() => updateQuantity(item.id, 0)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Summary Box */}
          <div className={styles.billingCard}>
            {promoMessage && (
              <div className={styles.promoBanner}>
                <Sparkles size={16} className={styles.promoSparkleIcon} />
                <span className={styles.promoText}>{promoMessage}</span>
              </div>
            )}

            <span className={styles.billingHeader}>Bill Details</span>

            {/* Driver Tip Option */}
            <div className={styles.tipContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, marginRight: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '700', color: '#111827', display: 'block', marginBottom: '4px' }}>
                    Tip your delivery partner
                  </label>
                  <span style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4', display: 'block' }}>
                    Your kindness means a lot! 100% of your tip goes directly to the partner.
                  </span>
                </div>
                <span style={{ fontSize: '24px' }}>🛵</span>
              </div>
              <div className={styles.tipOptions}>
                {[20, 30, 50].map((amount) => {
                  const emoji = amount === 20 ? '😊 ' : amount === 30 ? '🤩 ' : '😍 ';
                  return (
                    <button
                      key={amount}
                      className={`${styles.tipBtn} ${driverTip === amount ? styles.activeTipBtn : ''}`}
                      onClick={() => setDriverTip(driverTip === amount ? 0 : amount)}
                    >
                      {emoji}₹{amount}
                    </button>
                  );
                })}
                <button
                  className={`${styles.tipBtn} ${(driverTip > 0 && ![20, 30, 50].includes(driverTip)) ? styles.activeTipBtn : ''}`}
                  onClick={() => setIsCustomTipOpen(true)}
                >
                  {(driverTip > 0 && ![20, 30, 50].includes(driverTip)) ? `👏 ₹${driverTip}` : '👏 Custom'}
                </button>
              </div>
            </div>

            <div className={styles.billingRow}>
              <span>Subtotal</span>
              <span>₹{cartSubtotal}</span>
            </div>

            {cartSavings > 0 && (
              <div className={styles.billingRow}>
                <span>Product Discount</span>
                <span className={styles.savingsValue}>-₹{cartSavings}</span>
              </div>
            )}

            <div className={styles.billingRow}>
              <span>Delivery Partner Fee</span>
              <span className={deliveryFee === 0 ? styles.freeValue : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>

            <div className={styles.billingRow}>
              <span>Handling & Packaging Charges</span>
              <span>₹{handlingFee}</span>
            </div>



            {driverTip > 0 && (
              <div className={styles.billingRow}>
                <span>Driver Tip</span>
                <span>₹{driverTip}</span>
              </div>
            )}

            <div className={styles.billingTotal}>
              <span>Grand Total</span>
              <span>₹{finalTotal}</span>
            </div>

            <span className={styles.gstNotice}>
              * Prices are inclusive of all taxes. Free delivery above ₹300, and free packaging/handling above ₹500.
            </span>

            <button
              className={styles.checkoutBtn}
              onClick={() => router.push(`/checkout?tip=${driverTip}`)}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions Bar for Mobile Cart View */}
      {cartItems.length > 0 && (
        <div className={styles.stickyFooterMobile}>
          <div className={styles.addressSnippetRow}>
            <MapPin size={14} className={styles.accentGreenIcon} />
            <span className={styles.addressSnippetText}>
              {activeAddress
                ? `Delivering to: ${activeAddress.type} | ${activeAddress.flatNo}, ${activeAddress.addressLine}`
                : 'Please select a delivery address'}
            </span>
          </div>

          <div className={styles.checkoutActionRow}>
            <div className={styles.checkoutPriceBox}>
              <span className={styles.checkoutPriceText}>₹{finalTotal}</span>
              <span className={styles.checkoutPriceLabel}>TOTAL AMOUNT</span>
            </div>

            <button
              className={styles.checkoutBtnMobile}
              onClick={() => router.push(`/checkout?tip=${driverTip}`)}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Custom Tip Modal Dialog */}
      {isCustomTipOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Custom Tip</h3>
            <p className={styles.modalSubtitle}>Enter tip amount in Rupees</p>
            <input
              type="number"
              className={styles.modalInput}
              placeholder="e.g. 40"
              value={customTipInput}
              onChange={(e) => setCustomTipInput(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => {
                  setIsCustomTipOpen(false);
                  setCustomTipInput('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirmBtn}
                onClick={() => {
                  const val = parseInt(customTipInput, 10);
                  if (val > 0) {
                    setDriverTip(val);
                  }
                  setIsCustomTipOpen(false);
                  setCustomTipInput('');
                }}
              >
                Set Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Plus/Minus icons
function Plus({ size = 16, strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function Minus({ size = 16, strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
