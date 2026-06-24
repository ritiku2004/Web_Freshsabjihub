"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';

const GUEST_STORAGE_KEY = '@grocery_notifications_guest';

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAsRead: (id) => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  addNotification: (title, body, data) => {},
  refreshNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [tick, setTick] = useState(0);

  // Periodic ticker to refresh relative times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch or load notifications based on auth state
  const loadNotifications = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const dbList = await api.fetchNotifications();
        // Map database list to frontend schema
        const mappedList = dbList.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          data: n.data,
          isRead: Boolean(n.isRead),
          clickable: !!(n.data?.orderId || n.type),
          createdAt: n.createdAt
        }));
        setNotifications(mappedList);
      } catch (err) {
        console.error('[NotificationContext] Failed to fetch notifications from backend:', err);
      }
    } else {
      // Guest local storage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (stored) {
          try {
            setNotifications(JSON.parse(stored));
          } catch (e) {
            setNotifications([]);
          }
        } else {
          // Defaults for new guests
          const defaults = [
            {
              id: 'welcome_notif',
              title: 'Welcome to Fresh Sabji Hub! 🥬',
              message: 'Get farm-fresh vegetables, fruits, and daily grocery essentials delivered straight to your doorstep in superfast time.',
              type: 'system',
              timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
              isRead: false,
              clickable: false,
            },
            {
              id: 'promo_notif',
              title: 'Opening Special Discount! 🎉',
              message: 'Enjoy up to 10% off on premium fresh produce and daily essentials on your first transaction.',
              type: 'promo',
              timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
              isRead: false,
              clickable: true,
            }
          ];
          setNotifications(defaults);
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(defaults));
        }
      }
    }
  }, [isAuthenticated, user]);

  // Load notifications whenever authentication state changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const saveGuestNotifications = (newList) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newList));
    }
  };

  const addNotification = (title, body, data = {}) => {
    // Note: Primarily used for guest sessions on web. Backend-triggered
    // notifications for authenticated users are stored directly in DB.
    const newNotif = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
      title: title || 'New Notification',
      message: body || '',
      type: data.type || 'system',
      data: data,
      timestamp: Date.now(),
      isRead: false,
      clickable: !!data.orderId || !!data.type,
    };

    if (isAuthenticated) {
      // Optimistic update for authenticated user (though usually handled by DB polling/refreshes)
      setNotifications(prev => [newNotif, ...prev]);
    } else {
      const updated = [newNotif, ...notifications];
      saveGuestNotifications(updated);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

    if (isAuthenticated) {
      try {
        await api.markNotificationRead(id);
      } catch (err) {
        console.error('[NotificationContext] Failed to mark notification as read on backend:', err);
      }
    } else {
      const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      saveGuestNotifications(updated);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    if (isAuthenticated) {
      try {
        await api.markAllNotificationsRead();
      } catch (err) {
        console.error('[NotificationContext] Failed to mark all notifications as read on backend:', err);
      }
    } else {
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      saveGuestNotifications(updated);
    }
  };

  const clearAll = async () => {
    setNotifications([]);

    if (isAuthenticated) {
      try {
        await api.clearNotifications();
      } catch (err) {
        console.error('[NotificationContext] Failed to clear notifications on backend:', err);
      }
    } else {
      saveGuestNotifications([]);
    }
  };

  const getFormattedNotifications = () => {
    const now = Date.now();
    return notifications.map(n => {
      const ts = n.timestamp || (n.createdAt ? new Date(n.createdAt).getTime() : now);
      const diffMs = now - ts;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeStr = 'Just now';
      if (diffMins < 1) {
        timeStr = 'Just now';
      } else if (diffMins < 60) {
        timeStr = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeStr = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        timeStr = `${diffDays}d ago`;
      } else {
        timeStr = new Date(ts).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });
      }
      return { ...n, time: timeStr };
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: getFormattedNotifications(),
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        refreshNotifications: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
