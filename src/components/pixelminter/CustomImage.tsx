import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CustomImageProps {
  src: string;
  alt: string;
  layout: "fill" | "fixed" | "intrinsic" | "responsive";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  onError?: () => void;
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, layout, objectFit, onError }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (src) {
      setImageSrc(src);
      setIsAnimated(src.toLowerCase().endsWith('.gif') || src.toLowerCase().includes('animated'));
    } else {
      setImageSrc(null);
      setIsAnimated(false);
    }
  }, [src]);

  if (!imageSrc) {
    return null;
  }

  if (isAnimated) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        layout={layout}
        objectFit={objectFit}
        onError={() => {
          console.error('Error al cargar la imagen:', src);
          if (onError) onError();
        }}
        width={layout === 'fill' ? undefined : 100}
        height={layout === 'fill' ? undefined : 100}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      layout={layout}
      objectFit={objectFit}
      onError={() => {
        console.error('Error al cargar la imagen:', src);
        if (onError) onError();
      }}
      width={layout === 'fill' ? undefined : 100}
      height={layout === 'fill' ? undefined : 100}
    />
  );
};

export default CustomImage;