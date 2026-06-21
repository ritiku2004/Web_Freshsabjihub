"use client";

import React from 'react';
import { loaderBase64 } from './loaderBase64';
import styles from './Loader.module.css';

export default function Loader({ text = 'Freshness on the way' }) {
  const videoSrc = `data:video/webm;base64,${loaderBase64}`;

  return (
    <div className={styles.container}>
      <div className={styles.loaderWrapper}>
        <video 
          className={styles.videoElement}
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={videoSrc} type="video/webm" />
        </video>
      </div>
      <p className={styles.tipText}>{text}</p>
    </div>
  );
}

export { Loader };
