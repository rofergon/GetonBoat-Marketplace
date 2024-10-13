import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CustomImageProps {
  src: string;
  alt: string;
  layout: "fill" | "fixed" | "intrinsic" | "responsive";
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  onError?: () => void;
  className?: string;
}

const CustomImage: React.FC<CustomImageProps> = ({ src, alt, layout, objectFit, onError, className }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isGif, setIsGif] = useState(false);

  useEffect(() => {
    if (src) {
      setImageSrc(src);
      setIsGif(src.toLowerCase().endsWith('.gif'));
    } else {
      setImageSrc(null);
      setIsGif(false);
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
    className,
  };

  if (isGif) {
    return <Image {...imageProps} unoptimized />;
  }

  return <Image {...imageProps} />;
};

export default CustomImage;
