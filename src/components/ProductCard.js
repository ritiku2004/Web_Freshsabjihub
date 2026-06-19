"use client";

import React, { useContext } from 'react';
import { Clock, Plus, Minus } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import SafeImage from './SafeImage';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity } = useContext(CartContext);

  const { id, name, price, discountPrice, unit, image, stock = 50 } = product;
  const isOutOfStock = stock <= 0;

  // Check if item exists in cart
  const cartItem = cartItems.find((item) => String(item.productId) === String(id));
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Calculate discount percentage
  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (cartQuantity === 0) {
      addToCart(product);
    } else {
      updateQuantity(cartItem.id, cartQuantity + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id, cartQuantity - 1);
    }
  };

  return (
    <div className={`${styles.card} ${isOutOfStock ? styles.outOfStockCard : ''}`}>
      {/* Product Image Section */}
      <div className={styles.imageContainer}>
        <SafeImage
          src={image}
          alt={name}
          className={styles.image}
        />
        
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className={styles.outOfStockOverlay}>
            <span className={styles.outOfStockText}>OUT OF STOCK</span>
          </div>
        )}

        {/* Veg Icon (Bottom Left) */}
        <div className={styles.vegIcon}>
          <div className={styles.vegDot} />
        </div>

        {/* Overlapping ADD Button (Bottom Right) */}
        {!isOutOfStock && (
          <div className={styles.addButtonWrapper}>
            {cartQuantity === 0 ? (
              <button className={styles.addButton} onClick={handleIncrement}>
                ADD
              </button>
            ) : (
              <div className={styles.controlContainer}>
                <button className={styles.actionButton} onClick={handleDecrement}>
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className={styles.quantityText}>{cartQuantity}</span>
                <button
                  className={styles.actionButton}
                  onClick={handleIncrement}
                  disabled={cartQuantity >= stock}
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className={styles.infoContainer}>
        {/* Unit Tag */}
        <div className={styles.unitTag}>
          <span className={styles.unitText}>{unit}</span>
        </div>

        {/* Product Name */}
        <h4 className={styles.name} title={name}>
          {name}
        </h4>

        {/* Delivery Time Placeholder */}
        <div className={styles.deliveryRow}>
          <Clock size={12} className={styles.clockIcon} />
          <span className={styles.deliveryText}>14 MINS</span>
        </div>

        {/* Discount badge */}
        {hasDiscount && (
          <div className={styles.discountText}>
            {discountPercent}% OFF
          </div>
        )}

        {/* Price Row */}
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{discountPrice || price}</span>
          {hasDiscount && (
            <span className={styles.originalPrice}>MRP ₹{price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
