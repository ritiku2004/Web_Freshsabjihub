"use client";

import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../services/api';

export default function SafeImage({ src, alt, className, style, width, height }) {
  // SVG vector green organic placeholder for fresh vegetables/fruits
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23E8F5E9"/><circle cx="50" cy="50" r="25" fill="%23A5D6A7"/><path d="M50 25c-5 0-10 10-10 15s5 10 10 10 10-5 10-10-5-15-10-15z" fill="%2381C784"/><path d="M50 20c-1 0-3 3-3 5s2 4 3 4 3-2 3-4-2-5-3-5z" fill="%234CAF50"/></svg>`;

  const [imgSrc, setImgSrc] = useState(fallbackSvg);

  useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSvg);
      return;
    }

    let resolved = src;
    if (src.startsWith('/') && !src.startsWith('//')) {
      if (src.startsWith('/uploads/')) {
        const base = API_BASE_URL.replace('/api/v1', '');
        resolved = `${base}${src}`;
      }
    } else if (src.startsWith('uploads/')) {
      const base = API_BASE_URL.replace('/api/v1', '');
      resolved = `${base}/${src}`;
    }

    setImgSrc(resolved);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt || ''}
      className={className}
      style={style}
      width={width}
      height={height}
      onError={() => {
        if (imgSrc !== fallbackSvg) {
          setImgSrc(fallbackSvg);
        }
      }}
    />
  );
}
