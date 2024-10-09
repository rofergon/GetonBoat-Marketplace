/* eslint-disable no-unused-vars */
import React from 'react';
import { Button } from "@/components/ui/button";

interface CustomPaletteProps {
  customPalette: string[];
  onAddColor: () => void;
  onColorSelect: (color: string) => void;
  currentColor: string;
  onClearPalette: () => void;
}

const CustomPalette: React.FC<CustomPaletteProps> = ({
  customPalette,
  onAddColor,
  onColorSelect,
  currentColor,
  onClearPalette
}) => {
  return (
    <div className="w-full">
      <div className="flex mb-2 items-center">
        <div
          className="w-8 h-8 rounded-l-md border border-gray-600"
          style={{ backgroundColor: currentColor }}
        />
        <Button
          onClick={onAddColor}
          className="rounded-none h-8 px-2 py-0 text-xs bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
        >
          Add Color
        </Button>
        <Button
          onClick={onClearPalette}
          className="rounded-r-md h-8 px-2 py-0 text-xs bg-red-600 hover:bg-red-700 text-white"
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {customPalette.map((color, index) => (
          <button
            key={index}
            onClick={() => onColorSelect(color)}
            className="w-8 h-8 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
            title={color}
            aria-label={`Select custom color ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CustomPalette;