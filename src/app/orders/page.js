"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, AlertTriangle, CheckCircle, Clock, Sparkles, ChevronRight, Package, RotateCcw, Check } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import SafeImage from '../../components/SafeImage';
import Loader from '../../components/Loader';
import { MOCK_PRODUCTS, INITIAL_ORDERS } from '../data';
import { api } from '../../services/api';
import styles from '../page.module.css';

export default function OrdersPage() {
  const router = useRouter();
  const { activeAddress, serviceAvailable, isAuthenticated, user, loading } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);

  const [pastOrders, setPastOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!storedToken || !storedUser) {
        router.replace('/login');
      } else {
        setLoadingAuth(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const backendOrders = await api.getUserOrders(token);
            if (backendOrders && backendOrders.length > 0) {
              const mappedOrders = backendOrders.map(order => {
                const parts = (order.address_line1 || '').split('||');
                const flatNo = parts[0] || '';
                const addressLine = parts[1] || '';
                
                return {
                  id: order.id,
                  orderNumber: order.order_number,
                  date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                  status: order.status,
                  paymentMethod: order.payment_method === 'ONLINE' ? 'Online / Prepaid' : 'Cash on Delivery',
                  address: order.address_line1 ? `${flatNo}, ${addressLine}, City: ${order.city || 'N/A'}, Zip: ${order.zipcode || ''}` : 'Selected Address',
                  items: (order.items || []).map(item => ({
                    productId: item.product_id,
                    name: item.product_name,
                    quantity: item.quantity,
                    price: Number(item.price),
                    image: item.image_url
                  })),
                  totalAmount: Number(order.total_amount),
                  handlingCharge: Number(order.handling_fee),
                  deliveryPartnerFee: Number(order.delivery_fee)
                };
              });
              setPastOrders(mappedOrders);
              localStorage.setItem('pastOrders', JSON.stringify(mappedOrders));
              return;
            }
          } catch (error) {
            console.error('Error syncing orders:', error);
          }
        }
        
        // Fallback to local storage
        const saved = localStorage.getItem('pastOrders');
        if (saved) {
          try {
            setPastOrders(JSON.parse(saved));
          } catch (e) {
            setPastOrders(INITIAL_ORDERS);
          }
        } else {
          setPastOrders(INITIAL_ORDERS);
          localStorage.setItem('pastOrders', JSON.stringify(INITIAL_ORDERS));
        }
      }
    };
    
    fetchOrders();
  }, []);

  const handleReorder = (order) => {
    order.items.forEach(orderItem => {
      const match = MOCK_PRODUCTS.find(p => p.id === orderItem.productId);
      if (match && match.stock > 0) {
        addToCart(match);
      }
    });
    router.push('/cart');
  };

  const getOrderStatusConfig = (status) => {
    switch (status) {
      case 'Delivered':
        return { text: 'Delivered', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
      case 'Out for Delivery':
        return { text: 'Out for Delivery', color: '#16a34a', bg: '#dcfce7', border: '#22c55e' };
      case 'Processing':
        return { text: 'Processing', color: '#d97706', bg: '#fef3c7', border: '#f59e0b' };
      case 'Pending Payment':
        return { text: 'Payment Pending', color: '#d97706', bg: '#fef3c7', border: '#f59e0b' };
      case 'Cancelled':
        return { text: 'Cancelled', color: '#ef4444', bg: '#fee2e2', border: '#ef4444' };
      default:
        return { text: status || 'Processing', color: '#d97706', bg: '#fef3c7', border: '#f59e0b' };
    }
  };

  const getProductImage = (productId) => {
    const match = MOCK_PRODUCTS.find(p => p.id === productId);
    return match ? match.image : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150';
  };

  if (loadingAuth || loading) {
    return <Loader />;
  }

  if (!activeAddress) {
    return (
      <div className={styles.emptyStateContainer}>
        <MapPin size={48} color="#64748b" />
        <h2 className={styles.emptyStateTitle}>Choose Delivery Location</h2>
        <p className={styles.emptyStateText}>
          Please select a saved address or enter a valid zipcode to check serviceability and view past orders.
        </p>
        <button 
          className={styles.emptyStateBtn}
          onClick={() => router.push('/addresses')}
        >
          Add Address
        </button>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className={styles.emptyStateContainer}>
        <AlertTriangle size={48} color="#ef4444" />
        <h2 className={styles.emptyStateTitle}>No Service Available</h2>
      </div>
    );
  }

  return (
    <div className={styles.ordersPage}>
      <h3 className={styles.ordersPageTitle}>Order History</h3>

      {pastOrders.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          <ShoppingBag size={48} color="#64748b" />
          <h2 className={styles.emptyStateTitle}>No Orders Yet</h2>
          <p className={styles.emptyStateText}>
            You haven't placed any orders with us yet. Build your cart and place your first order.
          </p>
          <button className={styles.emptyStateBtn} onClick={() => router.push('/')}>
            Order Now
          </button>
        </div>
      ) : (
        pastOrders.map((order) => {
          const statusConfig = getOrderStatusConfig(order.status);
          const itemsSummary = order.items.map(item => item.name).join(', ');

          return (
            <div 
              key={order.id} 
              className={styles.orderCard}
              style={{ borderLeft: `4px solid ${statusConfig.border}` }}
            >
              {/* Header Section */}
              <div className={styles.orderHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={styles.packageIconBg}>
                    <Package size={16} className={styles.packageIcon} />
                  </div>
                  <div className={styles.orderHeaderInfo}>
                    <span className={styles.orderNo}>ID: {order.orderNumber}</span>
                    <span className={styles.orderDate}>{order.date}</span>
                  </div>
                </div>
                <span 
                  className={styles.orderStatusBadge}
                  style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                >
                  {statusConfig.text === 'Delivered' ? (
                    <CheckCircle size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                  ) : statusConfig.text === 'Out for Delivery' ? (
                    <Clock size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                  ) : (
                    <AlertTriangle size={10} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                  )}
                  <span style={{ verticalAlign: 'middle' }}>{statusConfig.text}</span>
                </span>
              </div>

              {/* Thumbnail Preview row */}
              <div className={styles.orderItemsPreviewRow}>
                <div className={styles.thumbnailScroll}>
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className={styles.thumbnailWrapper}>
                      <SafeImage src={item.image || getProductImage(item.productId)} alt={item.name} className={styles.thumbnailImage} />
                      <div className={styles.thumbnailBadge}>
                        <span>{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className={styles.moreItemsCircle}>
                      <span>+{order.items.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Details row */}
              <div className={styles.itemsSummaryRow}>
                <p className={styles.summaryText}>{itemsSummary}</p>
                <div className={styles.priceEtaRow}>
                  <span className={styles.summaryPrice}>Total Paid: ₹{order.totalAmount}</span>
                  <span className={styles.etaInfo}>
                    {order.status === 'Delivered'
                      ? `Delivered to ${activeAddress?.type || 'Home'}`
                      : 'ETA: 10 mins'}
                  </span>
                </div>
              </div>

              <div className={styles.cardDivider} />

              {/* Actions Row */}
              <div className={styles.orderActionRow}>
                <button 
                  className={styles.orderDetailsLinkBtn}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <span>View Details</span>
                  <ChevronRight 
                    size={14} 
                    className={styles.chevronIcon} 
                  />
                </button>
                
                <button className={styles.reorderBtn} onClick={() => handleReorder(order)}>
                  <RotateCcw size={12} style={{ marginRight: '6px' }} />
                  Order Again
                </button>
              </div>

              {/* Expanded details section */}
              {expandedOrderId === order.id && (
                <div className={styles.expandedDetailsContainer}>
                  {/* Stepper progress timeline */}
                  <div className={styles.trackerCard}>
                    <span className={styles.trackerTitle}>Delivery Progress</span>
                    <div className={styles.timeline}>
                      {/* Step 1: Confirmed */}
                      <div className={styles.timelineStep}>
                        <div className={styles.timelineLeft}>
                          <div className={`${styles.timelineDot} ${styles.timelineDotActive}`}>
                            <Check size={10} color="white" />
                          </div>
                          <div className={`${styles.timelineLine} ${order.status !== 'Pending Payment' && order.status !== 'Cancelled' ? styles.timelineLineActive : ''}`} />
                        </div>
                        <div className={styles.timelineRight}>
                          <span className={`${styles.stepTitle} ${styles.stepTitleActive}`}>Order Confirmed</span>
                          <span className={styles.stepSubtitle}>We have received and approved your order</span>
                        </div>
                      </div>

                      {/* Step 2: Out for Delivery */}
                      <div className={styles.timelineStep}>
                        <div className={styles.timelineLeft}>
                          <div className={`${styles.timelineDot} ${['Out for Delivery', 'Delivered'].includes(order.status) ? styles.timelineDotActive : ''}`}>
                            {['Out for Delivery', 'Delivered'].includes(order.status) && <Check size={10} color="white" />}
                          </div>
                          <div className={`${styles.timelineLine} ${order.status === 'Delivered' ? styles.timelineLineActive : ''}`} />
                        </div>
                        <div className={styles.timelineRight}>
                          <span className={`${styles.stepTitle} ${['Out for Delivery', 'Delivered'].includes(order.status) ? styles.stepTitleActive : ''}`}>Out for Delivery</span>
                          <span className={styles.stepSubtitle}>Our delivery partner is bringing your package</span>
                        </div>
                      </div>

                      {/* Step 3: Delivered */}
                      <div className={`${styles.timelineStep} ${styles.timelineLastStep}`}>
                        <div className={styles.timelineLeft}>
                          <div className={`${styles.timelineDot} ${order.status === 'Delivered' ? styles.timelineDotActive : ''}`}>
                            {order.status === 'Delivered' && <Check size={10} color="white" />}
                          </div>
                        </div>
                        <div className={styles.timelineRight}>
                          <span className={`${styles.stepTitle} ${order.status === 'Delivered' ? styles.stepTitleActive : ''}`}>Delivered</span>
                          <span className={styles.stepSubtitle}>Arrived safe & sound at your location</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Items breakdown */}
                  <div className={styles.detailsSection}>
                    <span className={styles.expandedSectionHeader}>Items Summary</span>
                    <div className={styles.expandedItemsList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.expandedItemRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <SafeImage src={getProductImage(item.productId)} alt={item.name} className={styles.expandedItemImg} />
                            <div>
                              <h5 className={styles.expandedItemName}>{item.name}</h5>
                              <span className={styles.expandedItemMeta}>{MOCK_PRODUCTS.find(p => p.id === item.productId)?.unit || '1 unit'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={styles.expandedItemPrice}>₹{item.price * item.quantity}</span>
                            <span className={styles.expandedItemQty}>{item.quantity} &times; ₹{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Address Summary */}
                  <div className={styles.detailsSection}>
                    <span className={styles.expandedSectionHeader}>Delivery Details</span>
                    <div className={styles.expandedDetailsCard}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Recipient Address</span>
                        <span className={styles.detailValue}>
                          {activeAddress 
                            ? `${activeAddress.flatNo}, ${activeAddress.addressLine}, Zip: ${activeAddress.zipcode}`
                            : 'No Address Specified'}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Delivery Partner</span>
                        <span className={styles.detailValue}>Assigning partner...</span>
                      </div>
                    </div>
                  </div>

                  {/* Bill breakup */}
                  <div className={styles.detailsSection} style={{ marginBottom: 0 }}>
                    <span className={styles.expandedSectionHeader}>Bill Breakup</span>
                    <div className={styles.expandedDetailsCard}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Items Total</span>
                        <span className={styles.detailValue}>₹{order.totalAmount}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Delivery Fee</span>
                        <span className={styles.detailValue} style={{ color: '#22c55e', fontWeight: '700' }}>FREE</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Packaging Charge</span>
                        <span className={styles.detailValue}>₹0</span>
                      </div>
                      <div className={`${styles.detailRow} ${styles.expandedTotalRow}`}>
                        <span className={styles.totalLabel}>Grand Total</span>
                        <span className={styles.totalValue}>₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
