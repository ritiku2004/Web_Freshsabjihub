"use client";

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, MapPin, AlertTriangle, CheckCircle, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import SafeImage from '../../components/SafeImage';
import { api } from '../../services/api';
import { MOCK_CATEGORIES } from '../data';
import styles from '../page.module.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, token, user, activeAddress, serviceAvailable, activeShop } = useContext(AuthContext);
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
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [latestOrderNo, setLatestOrderNo] = useState('');
  const paymentMethod = 'prepaid';
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = Math.round((cartGrandTotal + driverTip) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !token) {
      alert('Please login to place an order.');
      router.push('/login');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const orderPayload = {
        shopId: activeShop?.id || 1,
        addressId: activeAddress?.id,
        totalAmount: finalTotal,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        tipAmount: driverTip,
        discountAmount: cartSavings,
        handlingFee: handlingFee,
        deliveryFee: deliveryFee,
        paymentMethod: paymentMethod
      };

      const result = await api.createOrder(orderPayload, token);

      if (paymentMethod === 'cod') {
        const orderNo = result.data.orderNumber;
        const newOrder = {
          id: result.data.orderId,
          orderNumber: orderNo,
          date: new Date(result.data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          status: 'Processing',
          items: cartItems.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.discountPrice
          })),
          totalAmount: finalTotal
        };

        if (typeof window !== 'undefined') {
          const savedOrders = JSON.parse(localStorage.getItem('pastOrders') || '[]');
          localStorage.setItem('pastOrders', JSON.stringify([newOrder, ...savedOrders]));
        }

        setLatestOrderNo(orderNo);
        setShowOrderSuccess(true);
        clearCart();
        setDriverTip(0);
      } else {
        const rzpData = result.data;
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert('Failed to load Razorpay payment gateway. Please try again.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: rzpData.razorpayKeyId,
          amount: rzpData.amountPaise,
          currency: 'INR',
          name: 'Freshsabjihub',
          description: `Order #${rzpData.orderNumber}`,
          order_id: rzpData.razorpayOrderId,
          prefill: {
            name: user?.name || 'Guest User',
            email: user?.email || `${user?.phone_number || 'guest'}@freshsabjihub.com`,
            contact: user?.phone_number || ''
          },
          theme: {
            color: '#22c55e'
          },
          handler: async (response) => {
            try {
              const verificationPayload = {
                orderId: rzpData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              };

              const verificationResult = await api.verifyPayment(verificationPayload, token);

              if (verificationResult.success) {
                const newOrder = {
                  id: rzpData.orderId,
                  orderNumber: rzpData.orderNumber,
                  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                  status: 'Processing',
                  items: cartItems.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.discountPrice
                  })),
                  totalAmount: finalTotal
                };

                if (typeof window !== 'undefined') {
                  const savedOrders = JSON.parse(localStorage.getItem('pastOrders') || '[]');
                  localStorage.setItem('pastOrders', JSON.stringify([newOrder, ...savedOrders]));
                }

                clearCart();
                setDriverTip(0);
                router.push('/orders');
              } else {
                alert('Payment verification failed.');
              }
            } catch (err) {
              console.error(err);
              alert('Error verifying payment.');
            }
          },
          modal: {
            ondismiss: () => {
              alert('Payment process cancelled by user.');
            }
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred while placing the order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOrders = () => {
    setShowOrderSuccess(false);
    router.push('/orders');
  };

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

  if (showOrderSuccess) {
    return (
      <div className={styles.emptyStateContainer} style={{ borderColor: '#22c55e', background: '#f0fdf4' }}>
        <CheckCircle size={48} color="#22c55e" />
        <h2 className={styles.emptyStateTitle}>Order Placed Successfully!</h2>
        <p className={styles.emptyStateText}>
          Your order <strong>{latestOrderNo}</strong> has been received and is being prepared for delivery. It will arrive shortly.
        </p>
        <button className={styles.emptyStateBtn} onClick={handleViewOrders}>
          Track Order Status
        </button>
      </div>
    );
  }

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <MapPin size={48} color="#64748b" />
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select a saved address or enter a valid zipcode to check serviceability and browse products.
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
          We do not deliver to zipcode <strong>{activeAddress.zipcode}</strong>. We currently support select zipcodes of Noida and New Delhi (e.g. 10001 or 110070).
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
              Add items to your cart to experience superfast 12-minute delivery at your doorstep!
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

            <div className={styles.billingRow}>
              <span>GST Tax (5%)</span>
              <span>₹{Math.round(cartSubtotal * 0.05 * 100) / 100}</span>
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

            {/* Payment Method Selector removed for direct Razorpay checkout */}

            <span className={styles.gstNotice}>
              * Prices are inclusive of all taxes. Free delivery above ₹300, and free packaging/handling above ₹500.
            </span>

            <button
              className={styles.checkoutBtn}
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay & Place Order'}
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
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Pay & Place Order'}
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
