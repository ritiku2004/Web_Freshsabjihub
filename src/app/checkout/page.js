"use client";

import React, { useContext, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle, Shield, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import SafeImage from '../../components/SafeImage';
import { api } from '../../services/api';
import styles from './checkout.module.css';

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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token, user, activeAddress, serviceAvailable, activeShop, loading } = useContext(AuthContext);
  const {
    cartItems,
    cartSubtotal,
    cartSavings,
    deliveryFee,
    handlingFee,
    cartGrandTotal,
    clearCart
  } = useContext(CartContext);

  const driverTip = Number(searchParams.get('tip')) || 0;
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [latestOrderNo, setLatestOrderNo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentMethod = 'prepaid';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (!loading && cartItems.length === 0 && !showOrderSuccess) {
      router.replace('/cart');
    }
  }, [isAuthenticated, loading, cartItems, router, showOrderSuccess]);

  const finalTotal = Math.round((cartGrandTotal + driverTip) * 100) / 100;

  const handlePlaceOrder = async () => {
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
        name: 'Fresh Sabji Hub',
        description: `Order #${rzpData.orderNumber}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: user?.name || 'Guest User',
          email: user?.email || `${user?.phone_number || 'guest'}@freshsabjihub.com`,
          contact: user?.phone_number || ''
        },
        theme: {
          color: '#10B981'
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
              setLatestOrderNo(rzpData.orderNumber);
              setShowOrderSuccess(true);
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
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred while placing the order.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || (!isAuthenticated && !showOrderSuccess)) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (showOrderSuccess) {
    return (
      <div className={styles.successWrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIconCircle}>
            <CheckCircle size={48} color="#10B981" />
          </div>
          <h2 className={styles.successTitle}>Order Placed Successfully!</h2>
          <p className={styles.successText}>
            Your order <strong>{latestOrderNo}</strong> has been received and is being prepared for delivery.
          </p>
          <button className={styles.successBtn} onClick={() => router.push('/orders')}>
            Track Order Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <div className={styles.layout}>
        {/* Left Column: Details */}
        <div className={styles.leftColumn}>
          {/* Delivery Address Card */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <div className={styles.cardTitleGroup}>
                <MapPin size={20} className={styles.accentGreen} />
                <h3 className={styles.cardTitle}>Delivery Address</h3>
              </div>
            </div>
            {activeAddress ? (
              <div className={styles.addressBox}>
                <span className={styles.addressType}>{activeAddress.type}</span>
                <p className={styles.addressText}>
                  {activeAddress.flatNo}, {activeAddress.addressLine}
                </p>
                {activeAddress.receiverName && (
                  <p className={styles.receiverText}>
                    Recipient: {activeAddress.receiverName} | {activeAddress.receiverMobile}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.warningBox}>
                <AlertTriangle size={18} />
                <span>Please select a delivery address.</span>
              </div>
            )}
          </div>

          {/* Items Summary Card */}
          <div className={styles.card}>
            <div className={styles.cardTitleGroup} style={{ marginBottom: '16px' }}>
              <ShoppingBag size={20} className={styles.accentGreen} />
              <h3 className={styles.cardTitle}>Order Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</h3>
            </div>
            <div className={styles.itemsList}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemImageWrapper}>
                    <SafeImage src={item.image} alt={item.name} className={styles.itemImage} />
                  </div>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <span className={styles.itemMeta}>{item.unit} &times; {item.quantity}</span>
                  </div>
                  <div className={styles.itemPriceBox}>
                    <span className={styles.itemPrice}>₹{item.discountPrice * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Billing */}
        <div className={styles.rightColumn}>
          <div className={styles.billingCard}>
            <h3 className={styles.billingHeader}>Bill Details</h3>
            
            <div className={styles.billingRow}>
              <span>Items Subtotal</span>
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

            <div className={styles.securityBadge}>
              <Shield size={16} />
              <span>Safe and Secure Payments</span>
            </div>

            <button
              className={styles.payBtn}
              onClick={handlePlaceOrder}
              disabled={isProcessing || !activeAddress || !serviceAvailable}
            >
              {isProcessing ? 'Processing...' : `Pay & Place Order • ₹${finalTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer || ''} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <p style={{ fontSize: '16px', color: '#64748b' }}>Loading checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
