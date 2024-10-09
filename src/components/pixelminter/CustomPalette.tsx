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
          className="w-8 h-8 rounded-l border border-muted"
          style={{ backgroundColor: currentColor }}
        />
        <Button
          onClick={onAddColor}
          className="rounded-l-none rounded-r h-8 px-2 py-0 text-xs bg-muted hover:bg-muted"
        >
          Add Color
        </Button>
        <Button
          onClick={onClearPalette}
          className=" ml-2 rounded h-8 px-2 py-0 text-xs bg-red-700 hover:bg-red-800 text-white"
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap">
        {customPalette.map((color, index) => (
          <button
            key={index}
            onClick={() => onColorSelect(color)}
            className="w-8 h-8 rounded border border-muted focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 transition-transform hover:scale-110"
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