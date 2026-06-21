"use client";

import React, { useState, useEffect, useRef, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Mic, X, Bell } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { api } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import styles from './search.module.css';

const RECENT_SEARCHES_KEY = '@grocery_recent_searches';
const POPULAR_SUGGESTIONS = ['Tomato', 'Milk', 'Paneer', 'Onion', 'Potato', 'Apple', 'Banana'];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeShop, activeAddress, isAuthenticated } = useContext(AuthContext);
  const { cartItems, addToCart, updateQuantity, removeItem } = useContext(CartContext);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Starting...');
  const recognitionRef = useRef(null);

  const textInputRef = useRef(null);

  // Sync query local state with URL search param 'q' (from Navbar inputs)
  const qParam = searchParams.get('q') || '';
  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  // Load recent searches on mount & check for auto-voice param
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }

    if (searchParams.get('startVoice') === 'true') {
      startVoiceSearch();
    }
  }, [searchParams]);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, activeShop?.id]);

  const performSearch = async (searchTerm) => {
    if (!activeShop?.id) return;
    setLoading(true);
    try {
      const data = await api.getProducts({ 
        shopId: activeShop.id, 
        search: searchTerm, 
        limit: 20 
      });
      setResults(data.products || []);
    } catch (err) {
      console.error('Failed searching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = (selectedStr) => {
    saveRecentSearch(selectedStr);
    router.replace(`/search?q=${encodeURIComponent(selectedStr)}`);
  };

  const saveRecentSearch = (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    const filtered = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 5); // Keep last 5
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Browser Web Speech API Voice Search
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('Voice search not supported on this browser.');
      setIsListening(true);
      return;
    }

    setIsListening(true);
    setVoiceStatus('Listening... Speak now');

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setVoiceStatus('Listening... Speak now');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        handleSelectQuery(text);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setVoiceStatus('Microphone blocked. Please grant access.');
      } else {
        setVoiceStatus(`Could not hear clearly: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  // Cart Helper functions matching standard ProductCard requirements
  const getCartQuantity = (productId) => {
    const item = cartItems.find((ci) => String(ci.productId) === String(productId));
    return item ? item.quantity : 0;
  };

  const handleIncrement = (product) => {
    if (!activeShop?.id) return;
    addToCart(product, activeShop.id);
  };

  const handleDecrement = (product) => {
    const item = cartItems.find((ci) => String(ci.productId) === String(product.id));
    if (!item) return;
    if (item.quantity <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className={styles.searchContainer}>
      {!query.trim() ? (
        <div>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Searches</h3>
                <button type="button" onClick={handleClearRecent} className={styles.clearAllLink}>
                  Clear All
                </button>
              </div>
              <div className={styles.tagsWrapper}>
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.tagBtn}
                    onClick={() => handleSelectQuery(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Keywords suggestions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Popular Keywords</h3>
            <div className={styles.tagsWrapper} style={{ marginTop: '12px' }}>
              {POPULAR_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.tagBtn} ${styles.popularTagBtn}`}
                  onClick={() => handleSelectQuery(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines Info Card */}
          <div className={styles.infoCard}>
            <h4 className={styles.infoTitle}>Farm-to-Door Freshness 🥬</h4>
            <p className={styles.infoDesc}>
              All vegetables and fruits are sourced fresh daily from local farmers to guarantee taste and health.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {loading ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loaderSpinner} />
              <p className={styles.loaderText}>Searching catalog...</p>
            </div>
          ) : results.length > 0 ? (
            <div className={styles.resultsGrid}>
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  onPress={() => {
                    saveRecentSearch(query);
                    router.push(`/product/${product.id}`);
                  }}
                  onIncrement={() => handleIncrement(product)}
                  onDecrement={() => handleDecrement(product)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyResults}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3 className={styles.emptyTitle}>No matches found for "{query}"</h3>
              <p className={styles.emptyDesc}>
                Try adjusting your spelling or searching for another grocery category.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Voice Search Modal */}
      {isListening && (
        <div className={styles.voiceOverlay}>
          <div className={styles.voiceCard}>
            <div className={`${styles.micCircle} ${voiceStatus.includes('Listening') ? styles.micCirclePulsing : ''}`}>
              <Mic size={36} />
            </div>
            <h3 className={styles.voiceTitle}>Listening for Search</h3>
            <p className={styles.voiceStatus}>{voiceStatus}</p>

            <h4 className={styles.voiceSuggestionsTitle}>Popular Suggestions:</h4>
            <div className={styles.voiceTags}>
              {POPULAR_SUGGESTIONS.slice(0, 4).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={styles.voiceTagBtn}
                  onClick={() => {
                    handleSelectQuery(item);
                    stopVoiceSearch();
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <button type="button" className={styles.cancelBtn} onClick={stopVoiceSearch}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className={styles.loaderContainer}>
        <div className={styles.loaderSpinner} />
        <p className={styles.loaderText}>Loading search page...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
