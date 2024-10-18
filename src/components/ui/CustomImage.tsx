import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface CustomImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  onError?: () => void;
}

const CustomImage: React.FC<CustomImageProps> = ({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  sizes = "100vw",
  className, 
  onError,
  style,
  ...rest
}) => {
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

  const imageProps: ImageProps = {
    src: imageSrc,
    alt,
    sizes,
    className,
    style: { 
      objectFit: 'cover' as const, 
      ...style 
    },
    onError: () => {
      console.error('Error al cargar la imagen:', src);
      if (onError) onError();
    },
    ...rest
  };

  // Si fill es true, usamos fill. De lo contrario, usamos width y height.
  if (fill) {
    imageProps.fill = true;
  } else {
    imageProps.width = width || 100;
    imageProps.height = height || 100;
  }

  if (isGif) {
    return <Image {...imageProps} unoptimized />;
  }

  return <Image {...imageProps} />;
};

export default CustomImage;
