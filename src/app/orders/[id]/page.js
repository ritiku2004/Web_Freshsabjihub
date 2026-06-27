"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import SafeImage from '../../../components/SafeImage';
import Loader from '../../../components/Loader';
import { INITIAL_ORDERS, MOCK_PRODUCTS } from '../../data';
import styles from './page.module.css';
import { API_BASE_URL } from '../../../services/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pastOrders');
      let orders = INITIAL_ORDERS;
      if (saved) {
        try {
          orders = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }

      const found = orders.find(o => String(o.id) === String(id) || String(o.orderNumber) === String(id));
      if (found) {
        // Build items data with fallbacks for image/units if missing
        const mappedItems = found.items.map(item => {
          const match = MOCK_PRODUCTS.find(p => p.id === item.productId);
          return {
            ...item,
            image: match ? match.image : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
            unit: match ? match.unit : '1 unit'
          };
        });

        // Compute summaries
        const itemTotal = found.totalAmount;
        const handlingCharge = found.handlingCharge || 5;
        const deliveryPartnerFee = 0;
        const grandTotal = itemTotal + handlingCharge;

        setOrder({
          id: found.id,
          orderNumber: found.orderNumber,
          date: found.date,
          status: found.status || 'Delivered',
          paymentMethod: found.paymentMethod || 'Google Pay UPI',
          address: found.address || 'Selected Address',
          items: mappedItems,
          billSummary: {
            itemTotal,
            handlingCharge,
            deliveryPartnerFee,
            grandTotal
          }
        });
      } else {
        // Exact screenshot mock fallback for demo/invalid IDs
        setOrder({
          id: id,
          orderNumber: "ORD455875",
          date: "20 Jun 2026, 9:02 pm",
          status: "Pending Payment",
          paymentMethod: "Google Pay UPI",
          address: "Selected Address",
          items: [
            { productId: "p1", name: "Aashirvaad Atta (5 kg)", quantity: 1, price: 1269, image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300", unit: "5 kg" },
            { productId: "p2", name: "Aashirvaad Atta (1 kg)", quantity: 1, price: 1296, image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300", unit: "1 kg" }
          ],
          billSummary: {
            itemTotal: 2565,
            handlingCharge: 5,
            deliveryPartnerFee: 0,
            grandTotal: 2693.25
          }
        });
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.loadingWrapper}>
        <h2>Order not found</h2>
        <button onClick={() => router.back()} className={styles.retryButton} style={{ width: 'auto', padding: '0 24px' }}>Go Back</button>
      </div>
    );
  }

  // Determine if order needs payment action (including if it's our mock order or has payment pending)
  const isPending = order.status === 'Pending Payment' || order.status === 'Processing' || order.orderNumber === 'ORD455875';

  // Timeline active flags
  const step1Active = true; // Awaiting confirmation is always active/green
  const step2Active = !['Pending Payment', 'Cancelled'].includes(order.status);
  const step3Active = ['Out for Delivery', 'On the Way', 'Delivered'].includes(order.status);
  const step4Active = order.status === 'Delivered';

  const grandTotalText = `₹${Number(order.billSummary.grandTotal).toFixed(2)}`;

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/user/orders/${order.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className={styles.backButton} onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Order Details</h1>
        </div>
        {!isPending && (
          <button 
            onClick={handleDownloadInvoice}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              border: '1px solid #2e7d32',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: 'auto'
            }}
          >
            Download Invoice
          </button>
        )}
      </header>

      {/* Main Content Wrap */}
      <div className={styles.content}>
        {/* Action Required Box */}
        {isPending && (
          <div className={styles.alertBox}>
            <div className={styles.alertHeader}>
              <AlertTriangle size={18} />
              <span>Action Required: Payment Pending</span>
            </div>
            <p className={styles.alertText}>
              Your payment verification is pending. Please click the "Retry Payment" button at the bottom to complete your transaction, otherwise this order will be cancelled.
            </p>
          </div>
        )}

        {/* Content Layout Columns */}
        <div className={styles.gridContainer}>
          
          {/* Left Column: Progress & Summary */}
          <div className={styles.leftColumn}>
            {/* Delivery Progress */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Delivery Progress</h3>
              <div className={styles.timeline}>
                
                {/* Step 1 */}
                <div className={styles.timelineStep}>
                  <div className={styles.timelineLeft}>
                    <div className={`${styles.timelineDot} ${step1Active ? styles.timelineDotActive : ''}`} />
                    <div className={`${styles.timelineLine} ${step2Active ? styles.timelineLineActive : ''}`} />
                  </div>
                  <div className={styles.timelineRight}>
                    <span className={`${styles.stepTitle} ${step1Active ? styles.stepTitleActive : ''}`}>Waiting for Confirmation</span>
                    <span className={styles.stepSubtitle}>Awaiting verification or payment confirmation</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={styles.timelineStep}>
                  <div className={styles.timelineLeft}>
                    <div className={`${styles.timelineDot} ${step2Active ? styles.timelineDotActive : ''}`} />
                    <div className={`${styles.timelineLine} ${step3Active ? styles.timelineLineActive : ''}`} />
                  </div>
                  <div className={styles.timelineRight}>
                    <span className={`${styles.stepTitle} ${step2Active ? styles.stepTitleActive : ''}`}>Order Confirmed</span>
                    <span className={styles.stepSubtitle}>Your order has been accepted and is preparing</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={styles.timelineStep}>
                  <div className={styles.timelineLeft}>
                    <div className={`${styles.timelineDot} ${step3Active ? styles.timelineDotActive : ''}`} />
                    <div className={`${styles.timelineLine} ${step4Active ? styles.timelineLineActive : ''}`} />
                  </div>
                  <div className={styles.timelineRight}>
                    <span className={`${styles.stepTitle} ${step3Active ? styles.stepTitleActive : ''}`}>On the Way</span>
                    <span className={styles.stepSubtitle}>Our delivery partner is bringing your package</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`${styles.timelineStep} ${styles.timelineLastStep}`}>
                  <div className={styles.timelineLeft}>
                    <div className={`${styles.timelineDot} ${step4Active ? styles.timelineDotActive : ''}`} />
                  </div>
                  <div className={styles.timelineRight}>
                    <span className={`${styles.stepTitle} ${step4Active ? styles.stepTitleActive : ''}`}>Delivered</span>
                    <span className={styles.stepSubtitle}>Arrived safe & sound at your location</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Summary Card */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Summary</h3>
              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Order ID</span>
                  <span className={styles.summaryValue}>{order.orderNumber}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Placed On</span>
                  <span className={styles.summaryValue}>{order.date}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Payment Method</span>
                  <span className={styles.summaryValue}>{order.paymentMethod}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Delivery Address</span>
                  <span className={styles.summaryValue}>{order.address}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Items & Bill */}
          <div className={styles.rightColumn}>
            {/* Items Ordered Card */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Items Ordered</h3>
              <div className={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <div className={styles.itemLeft}>
                      <SafeImage src={item.image} alt={item.name} className={styles.itemImage} />
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemQty}>Qty: {item.quantity} x</span>
                      </div>
                    </div>
                    <span className={styles.itemPrice}>₹{item.price}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bill Summary Card */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Bill Summary</h3>
              <div className={styles.billList}>
                <div className={styles.billRow}>
                  <span className={styles.billLabel}>Item Total</span>
                  <span className={styles.billValue}>₹{order.billSummary.itemTotal}</span>
                </div>
                <div className={styles.billRow}>
                  <span className={styles.billLabel}>Handling charge</span>
                  <span className={styles.billValue}>₹{order.billSummary.handlingCharge}</span>
                </div>
                <div className={styles.billRow}>
                  <span className={styles.billLabel}>Delivery partner fee</span>
                  <span className={styles.billFree}>
                    {order.billSummary.deliveryPartnerFee === 0 ? 'FREE' : `₹${order.billSummary.deliveryPartnerFee}`}
                  </span>
                </div>
                <div className={styles.divider} />
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Grand Total</span>
                  <span className={styles.totalValue}>{grandTotalText}</span>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Unified Action Container at the end of content flow */}
        <div className={styles.actionContainer}>
          <button className={styles.retryButton} onClick={() => alert('Processing payment... Thank you!')}>
            Retry Payment ({grandTotalText})
          </button>
        </div>
      </div>
    </div>
  );
}
