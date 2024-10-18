/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import CustomImage from '../ui/CustomImage';

interface ReferenceImageProps {
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onPositionChange: (newPosition: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onUrlChange: (url: string) => void;
}

const ReferenceImage: React.FC<ReferenceImageProps> = ({
  url,
  position,
  size,
  onPositionChange,
  onSizeChange,
  onUrlChange,
}) => {
  const [opacity, setOpacity] = useState(100);
  const [imageUrl, setImageUrl] = useState(url);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = url;
    }
    setImageUrl(url);
    setIsValidUrl(isValidImageUrl(url));
  }, [url]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const isValidImageUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:');
  };

  const handleImageError = () => {
    console.error('Error al cargar la imagen:', imageUrl);
    setIsValidUrl(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      onUrlChange(objectUrl);
      setIsValidUrl(true);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    onUrlChange(newUrl);
    setIsValidUrl(isValidImageUrl(newUrl));
  };

  const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            onUrlChange(objectUrl);
            setIsValidUrl(true);
            if (inputRef.current) {
              inputRef.current.value = objectUrl;
            }
            break;
          }
        }
      }
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onDrag={(e, data) => onPositionChange({ x: data.x, y: data.y })}
      handle=".drag-handle"
    >
      <div
        ref={nodeRef}
        className="absolute bg-white rounded-lg shadow-lg overflow-hidden pointer-events-auto"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          opacity: opacity / 100,
        }}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex items-center p-1 bg-white gap-2 drag-handle cursor-move pointer-events-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
            <input
              ref={inputRef}
              type="url"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="URL: https://example.com/image.png o pega una imagen"
              onChange={(e) => handleUrlChange(e.target.value)}
              aria-label="Reference image URL"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white px-2 py-1 rounded">
              Upload
            </label>
            <div className="pointer-events-auto">
              <label htmlFor="opacity" className="block text-xs font-medium text-gray-900 -mb-1">
                
              </label>
              <input
                id="opacity"
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Ajustar opacidad"
              />
            </div>
          </div>
          {isValidUrl && (
            <div className="flex-grow relative">
              <CustomImage
                src={imageUrl}
                alt="Reference"
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
                onError={handleImageError}
              />
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default ReferenceImage;
