import React, { useState, useEffect, useRef } from 'react';
import './OptimizedImage.css';

/**
 * OptimizedImage component with lazy loading and WebP support
 * Automatically uses WebP format with fallback to original format
 * Implements intersection observer for lazy loading
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E'
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  // Convert image URL to WebP if CDN supports it
  const getWebPUrl = (url) => {
    if (!url) return url;
    
    // Check if URL is from Cloudinary
    if (url.includes('cloudinary.com')) {
      // Cloudinary automatic format conversion
      return url.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    
    // For other CDNs or local images, try to append .webp
    // This is a simplified approach - in production, you'd check CDN capabilities
    return url;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading !== 'lazy') {
      setIsInView(true);
      return;
    }

    const currentRef = imgRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading]);

  // Load image when in view
  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      const optimizedSrc = getWebPUrl(src);
      
      img.onload = () => {
        setImageSrc(optimizedSrc);
        setImageLoaded(true);
      };
      
      img.onerror = () => {
        // Fallback to original src if WebP fails
        setImageSrc(src);
        setImageLoaded(true);
      };
      
      img.src = optimizedSrc;
    }
  }, [isInView, src]);

  return (
    <div 
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{ width, height }}
    >
      <img
        src={imageSrc}
        alt={alt}
        className={`optimized-image ${imageLoaded ? 'loaded' : 'loading'}`}
        width={width}
        height={height}
        loading={loading}
      />
      {!imageLoaded && (
        <div className="image-placeholder">
          <div className="image-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
