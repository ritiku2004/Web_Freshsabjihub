"use client";

import React, { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import styles from './FloatingCart.module.css';

export default function FloatingCart() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, cartGrandTotal, cartTotalQuantity } = useContext(CartContext);
  const [visible, setVisible] = useState(false);

  // Hide on cart/checkout pages or when cart is empty
  const hiddenPaths = ['/cart', '/checkout'];
  const shouldHide = hiddenPaths.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (shouldHide || cartTotalQuantity === 0) {
      setVisible(false);
      return;
    }

    const handleScroll = () => {
      setVisible(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldHide, cartTotalQuantity]);

  if (shouldHide || cartTotalQuantity === 0) return null;

  return (
    <button
      className={`${styles.floatingCart} ${visible ? styles.show : ''}`}
      onClick={() => router.push('/cart')}
      aria-label="View Cart"
    >
      <div className={styles.cartIconWrap}>
        <ShoppingCart size={20} />
        <span className={styles.badge}>{cartTotalQuantity}</span>
      </div>
      <div className={styles.info}>
        <span className={styles.itemCount}>{cartTotalQuantity} item{cartTotalQuantity > 1 ? 's' : ''}</span>
        <span className={styles.price}>₹{Math.round(cartGrandTotal * 100) / 100}</span>
      </div>
    </button>
  );
}
