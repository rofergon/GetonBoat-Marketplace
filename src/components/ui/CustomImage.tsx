import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CustomImageProps {
  src: string;
  alt: string;
  layout: "fill" | "fixed" | "intrinsic" | "responsive";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  onError?: () => void;
  className?: string; // Añadimos className a la interfaz
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, layout, objectFit, onError, className }) => {
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

  const imageProps = {
    src: imageSrc,
    alt,
    layout,
    objectFit,
    onError: () => {
      console.error('Error al cargar la imagen:', src);
      if (onError) onError();
    },
    width: layout === 'fill' ? undefined : 100,
    height: layout === 'fill' ? undefined : 100,
    className, // Añadimos className a las props de Image
  };

  if (isAnimated) {
    return <Image {...imageProps} unoptimized />;
  }

  return <Image {...imageProps} />;
};

export default CustomImage;
