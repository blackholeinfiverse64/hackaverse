import { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = true,
  width,
  height,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder ? null : src);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src]);

  return (
    <div ref={imgRef} className={`overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && placeholder && (
        <div className="w-full h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer" />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
