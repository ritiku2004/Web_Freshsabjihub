"use client";

import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft, Package, Tag, Info, Trash2, CheckSquare } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AuthContext } from '../../context/AuthContext';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  const getIcon = (type) => {
    switch (type) {
      case 'order':
      case 'order_status':
        return <Package className={styles.iconOrder} size={20} />;
      case 'promo':
        return <Tag className={styles.iconPromo} size={20} />;
      default:
        return <Info className={styles.iconDefault} size={20} />;
    }
  };

  const handleNotificationClick = async (item) => {
    await markAsRead(item.id);
    if (item.clickable) {
      if (item.type === 'order' || item.type === 'order_status') {
        if (item.data?.orderId) {
          router.push(`/orders?id=${item.data.orderId}`);
        } else {
          router.push('/orders');
        }
      } else if (item.type === 'promo') {
        router.push('/categories');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={styles.notificationsPage}>
      {notifications.length > 0 && (
        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={markAllAsRead}>
            <CheckSquare size={16} /> Mark All Read
          </button>
          <button className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={clearAll}>
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      )}

      <div className={styles.content}>
        {notifications.length > 0 ? (
          <div className={styles.notificationsList}>
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`${styles.notificationCard} ${!item.isRead ? styles.unreadCard : ''} ${item.clickable ? styles.clickableCard : ''}`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className={styles.iconWrapper}>
                  {getIcon(item.type)}
                </div>
                <div className={styles.textContainer}>
                  <div className={styles.cardHeader}>
                    <h3 className={`${styles.title} ${!item.isRead ? styles.unreadTitle : ''}`}>
                      {item.title}
                    </h3>
                    <span className={styles.timeText}>{item.time}</span>
                  </div>
                  <p className={styles.messageText}>{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconCircle}>
              <Bell size={40} className={styles.emptyBell} />
            </div>
            <h2 className={styles.emptyTitle}>No Notifications Yet</h2>
            <p className={styles.emptySubtitle}>When you get notifications, they'll show up here</p>
          </div>
        )}
      </div>
    </div>
  );
}
