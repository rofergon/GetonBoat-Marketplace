import React from 'react';
import { Palette } from 'lucide-react';

interface ColorPaletteProps {
  onColorSelect: (color: string) => void;
  palette: string[];
  theme: string;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ onColorSelect, palette, theme }) => {
  return (
    <div className="bg-gray-800 p-2 rounded-md mb-2">
      {theme && (
        <h3 className="text-sm font-semibold mb-1 flex items-center">
          <Palette className="mr-1" size={14} aria-hidden="true" />
          Theme: {theme}
        </h3>
      )}
      <div className="flex flex-wrap gap-1">
        {palette.map((color, index) => (
          <button
            key={index}
            onClick={() => onColorSelect(color)}
            className="w-5 h-5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors"
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;