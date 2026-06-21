"use client";

import React, { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2, Minus, Plus, Truck, Leaf, ShieldAlert, Check } from 'lucide-react';
import { CartContext } from '../../../context/CartContext';
import { AuthContext } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import SafeImage from '../../../components/SafeImage';
import Loader from '../../../components/Loader';
import ProductCard from '../../../components/ProductCard';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeShop } = useContext(AuthContext);
  const { cartItems, addToCart, updateQuantity } = useContext(CartContext);

  // React Query: Fetch product info
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['productDetails', id],
    queryFn: () => api.getProductDetails(id),
    enabled: !!id,
  });

  // React Query: Fetch related products from the same category
  const { data: relatedData } = useQuery({
    queryKey: ['relatedProducts', product?.categoryId, activeShop?.id],
    queryFn: () => api.getProducts({ shopId: activeShop?.id, categoryId: product?.categoryId, limit: 5 }),
    enabled: !!product?.categoryId && !!activeShop?.id,
  });

  const relatedProducts = (relatedData?.products || [])
    .filter((p) => String(p.id) !== String(id))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader text="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.loadingWrapper}>
        <h2>Product not found</h2>
        <button onClick={() => router.back()} className={styles.addButton}>Go Back</button>
      </div>
    );
  }

  // Find quantity in cart
  const cartItem = cartItems.find((item) => String(item.productId) === String(product.id));
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice) || price;
  const hasDiscount = discountPrice < price;
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const totalPrice = discountPrice * (cartQuantity || 1);
  const isOutOfStock = product.stock <= 0 || product.is_available === 0 || product.isAvailable === false;

  const handleIncrement = () => {
    if (isOutOfStock) return;
    if (cartQuantity === 0) {
      addToCart(product);
    } else {
      updateQuantity(cartItem.id, cartQuantity + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartQuantity - 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Fresh Sabji Hub!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Mobile-only Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.headerTitle}>{product.name}</h1>
        <button className={styles.shareButton} onClick={handleShare} aria-label="Share product">
          <Share2 size={22} />
        </button>
      </header>

      {/* Breadcrumbs / Back navigation for Desktop */}
      <div className={styles.desktopBackContainer}>
        <button className={styles.desktopBackBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back to Products
        </button>
      </div>

      <div className={styles.mainContentGrid}>
        {/* Left Column: Image Section */}
        <section className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <SafeImage
              src={product.image}
              alt={product.name}
              className={styles.image}
            />
            {isOutOfStock && (
              <div className={styles.outOfStockOverlay}>
                <span className={styles.outOfStockText}>OUT OF STOCK</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Info & Action Section */}
        <div className={styles.rightColumn}>
          <section className={styles.detailsSection}>
            <h2 className={styles.title}>{product.name}</h2>
            <p className={styles.unit}>{product.unit}</p>

            <div className={styles.priceLayout}>
              {hasDiscount ? (
                <div className={styles.priceRow}>
                  <span className={styles.discountPrice}>₹{discountPrice}</span>
                  <span className={styles.originalPrice}>₹{price}</span>
                  <span className={styles.savingsLabel}>{discountPercent}% OFF</span>
                </div>
              ) : (
                <div className={styles.priceRow}>
                  <span className={styles.discountPrice}>₹{price}</span>
                </div>
              )}
            </div>

            {/* Desktop-only Actions */}
            <div className={styles.desktopActions}>
              {isOutOfStock ? (
                <button className={styles.disabledButton} disabled>
                  OUT OF STOCK
                </button>
              ) : cartQuantity === 0 ? (
                <button className={styles.addButton} onClick={handleIncrement}>
                  ADD TO CART
                </button>
              ) : (
                <div className={styles.quantityWidget}>
                  <button className={styles.qtyButton} onClick={handleDecrement}>
                    <Minus size={16} strokeWidth={2.5} />
                  </button>
                  <span className={styles.qtyText}>{cartQuantity}</span>
                  <button className={styles.qtyButton} onClick={handleIncrement}>
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Product Description Details */}
          {product.description && product.description.trim().length > 0 && (
            <section className={styles.detailsSection2}>
              <h3 className={styles.sectionHeading}>Product Details</h3>
              <p className={styles.sectionContent}>{product.description}</p>
            </section>
          )}

          {/* Technical Specifications */}
          {product.features && product.features.length > 0 && (
            <section className={styles.detailsSection2}>
              <h3 className={styles.sectionHeading}>Specifications</h3>
              <div className={styles.specsGrid}>
                {product.features.map((feature, idx) => (
                  <div key={idx} className={styles.specRow}>
                    <span className={styles.specName}>{feature.feature_name}</span>
                    <span className={styles.specValue}>{feature.feature_value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Why Choose FreshSabjiHub Section */}
          <section className={styles.whyChooseSection}>
            <h3 className={styles.whyChooseHeading}>Why Choose Fresh Sabji Hub?</h3>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.iconContainer}>
                  <Truck size={20} />
                </div>
                <div className={styles.featureTexts}>
                  <h4 className={styles.featureTitle}>Superfast Delivery</h4>
                  <p className={styles.featureDesc}>Get fresh items at your doorstep within minutes.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.iconContainer}>
                  <Leaf size={20} />
                </div>
                <div className={styles.featureTexts}>
                  <h4 className={styles.featureTitle}>Freshness Sourced Daily</h4>
                  <p className={styles.featureDesc}>Products undergo rigorous quality checks before shipping.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.iconContainer}>
                  <Check size={20} />
                </div>
                <div className={styles.featureTexts}>
                  <h4 className={styles.featureTitle}>Safe & Sealed Packaging</h4>
                  <p className={styles.featureDesc}>We ensure products are packed in clean, sealed, and safe bags.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Product Suggestions List */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <h3 className={styles.relatedHeading}>You Might Also Like</h3>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile-only Sticky Footer */}
      <footer className={styles.stickyFooter}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>Total Price</span>
          <span className={styles.footerPrice}>₹{totalPrice}</span>
        </div>

        <div>
          {isOutOfStock ? (
            <div className={styles.disabledStickyButton}>OUT OF STOCK</div>
          ) : cartQuantity === 0 ? (
            <button className={styles.addButton} onClick={handleIncrement}>
              ADD
            </button>
          ) : (
            <div className={styles.quantityWidget}>
              <button className={styles.qtyButton} onClick={handleDecrement}>
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className={styles.qtyText}>{cartQuantity}</span>
              <button className={styles.qtyButton} onClick={handleIncrement}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
