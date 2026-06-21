"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';

const NOTIFICATIONS_STORAGE_KEY = '@grocery_notifications';

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  markAsRead: (id) => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  addNotification: (title, body, data) => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        try {
          setNotifications(JSON.parse(stored));
        } catch (e) {}
      } else {
        // Initialize with default notifications
        const defaults = [
          {
            id: 'welcome_notif',
            title: 'Welcome to Fresh Sabji Hub! 🥬',
            message: 'Get farm-fresh vegetables, fruits, and daily grocery essentials delivered straight to your doorstep in superfast time.',
            type: 'system',
            time: 'Just now',
            timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
            isRead: false,
            clickable: false,
          },
          {
            id: 'promo_notif',
            title: 'Opening Special Discount! 🎉',
            message: 'Enjoy up to 10% off on premium fresh produce and daily essentials on your first transaction.',
            type: 'promo',
            time: '10m ago',
            timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
            isRead: false,
            clickable: true,
          }
        ];
        setNotifications(defaults);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(defaults));
      }
    }
  }, []);

  const saveNotifications = (newList) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newList));
    }
  };

  const addNotification = (title, body, data = {}) => {
    const newNotif = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
      title: title || 'New Notification',
      message: body || '',
      type: data.type || 'system',
      data: data,
      time: 'Just now',
      timestamp: Date.now(),
      isRead: false,
      clickable: !!data.orderId || !!data.type,
    };
    const updated = [newNotif, ...notifications];
    saveNotifications(updated);
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const getFormattedNotifications = () => {
    const now = Date.now();
    return notifications.map(n => {
      const diffMs = now - n.timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeStr = n.time;
      if (n.timestamp) {
        if (diffMins < 1) {
          timeStr = 'Just now';
        } else if (diffMins < 60) {
          timeStr = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          timeStr = `${diffHours}h ago`;
        } else {
          timeStr = `${diffDays}d ago`;
        }
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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
