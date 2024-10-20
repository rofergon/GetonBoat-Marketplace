import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { ipfsToHttp } from '../../utils/ipfsToHttp'; // Asegúrate de que la ruta sea correcta

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
      const convertedSrc = ipfsToHttp(src);
      setImageSrc(convertedSrc);
      setIsGif(convertedSrc.toLowerCase().endsWith('.gif'));
    } else {
      setImageSrc(null);
      setIsGif(false);
    }
  }, [src]);

  if (!imageSrc) {
    return null;
  }

  const imageProps: Partial<ImageProps> = {
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

  // Priorizar fill sobre width/height
  if (fill) {
    imageProps.fill = true;
    // Eliminar width y height si fill está presente
    delete imageProps.width;
    delete imageProps.height;
  } else if (width && height) {
    imageProps.width = width;
    imageProps.height = height;
  } else {
    // Valores por defecto si no se proporciona ni fill ni width/height
    imageProps.width = 100;
    imageProps.height = 100;
  }

  if (isGif) {
    return <Image {...imageProps as ImageProps} unoptimized />;
  }

  return <Image {...imageProps as ImageProps} />;
};

export default CustomImage;
