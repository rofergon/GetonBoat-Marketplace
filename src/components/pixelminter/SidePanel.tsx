/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ColorPalette from './ColorPalette';
import CustomPalette from './CustomPalette';
import ConnectWalletButton from './ConnectWalletButton';
import LayerManager from './LayerPanel';
import { State, BrushData } from '../../types/types';
import { Palette, Grid, Image, Code, Droplet, Layers, Plus } from 'lucide-react';
import { useSidePanelLogic } from '../../hooks/useSidePanelLogic';
import { usePixelCountAndDroplets } from '../../hooks/usePixelCount';
import MintBPButton from './MintBPButton';
import MintPixelminterButton from './MintPixelminterButton';
import { encodePixelData } from '../../utils/encodingUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SidePanelProps {
  state: State;
  updateState: (newState: Partial<State> | ((prevState: State) => Partial<State>)) => void;
  handleExtractPalette: () => void;
  onGridSizeChange: (newSize: number) => void;
  isExporting: boolean;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayerVisibility: (id: string, visible: boolean) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  setActiveLayerId: (id: string) => void;
  updateLayerName: (id: string, name: string) => void;
  brushData: BrushData | null;
  updateBrushData: (data: BrushData | null) => void;
  fps: number; // Asegúrate de añadir esta prop
}

const SidePanel: React.FC<SidePanelProps> = ({
  state,
  updateState,
  handleExtractPalette,
  onGridSizeChange,
  isExporting,
  addLayer,
  removeLayer,
  updateLayerVisibility,
  updateLayerOpacity,
  setActiveLayerId,
  updateLayerName,
  brushData,
  updateBrushData,
  fps
}) => {
  const [encodedData, setEncodedData] = useState<string | null>(null);

  const {
    isClient,
    toggleBackgroundImage,
    handleAddCustomColor,
    handleClearCustomPalette,
    handleEncodeData
  } = useSidePanelLogic(state, updateState, handleExtractPalette, onGridSizeChange);
  const [isBasepaintOpen, setIsBasepaintOpen] = useState(false);
  const [isCustomPaletteOpen, setIsCustomPaletteOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isGridSizeOpen, setIsGridSizeOpen] = useState(false);
  const initialDroplets = useMemo(() => brushData?.pixelsPerDay || state.pixelsPerDay || 0, [brushData, state.pixelsPerDay]);

  const { pixelCount, droplets } = usePixelCountAndDroplets(state, initialDroplets);

  const resetEncodedState = () => {
    setEncodedData(null);
  };

  const handleEncode = () => {
    const data = encodePixelData(state);
    setEncodedData(data);
  };

  return (
    <div className="w-full max-w-xs flex flex-col p-3 space-y-3 h-full overflow-y-auto text-white bg-muted">
      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsBasepaintOpen(!isBasepaintOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Palette className="mr-2" size={16} />Basepaint</h3>
          {isBasepaintOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isBasepaintOpen && (
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-blue-800 px-3 py-1 rounded-md shadow-sm flex items-center justify-center h-8">
                <Droplet className="text-yellow-300 fill-yellow-300" size={12} />
                <span className="text-yellow-300 font-semibold text-xs ml-1 font-variant-numeric tabular-nums">{droplets}</span>
              </div>

              <Button
                onClick={handleExtractPalette}
                disabled={state.isPaletteLoading || isExporting}
                className="h-8 w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center py-1 px-2 rounded-md shadow-sm text-sm"
              >
                <Palette className="mr-1" size={14} aria-hidden="true" />
                {state.isPaletteLoading ? 'Loading...' : 'Get Daily Palette'}
              </Button>
            </div>

            {isClient && state.palette.length > 0 && (
              <div className="p-2 rounded-md shadow-sm">
                <h3 className="text-base font-semibold mb-1 flex items-center">
                  <Palette className="mr-1" size={15} aria-hidden="true" /> Theme: {state.theme}
                </h3>
                <ColorPalette
                  onColorSelect={(color: string) => updateState({ color })}
                  palette={state.palette}
                  theme={state.theme}
                />
              </div>
            )}

            <div className="my-3">
              <h4 className="text-xs font-semibold mb-1">Background Opacity</h4>
              <Slider
                id="backgroundOpacity"
                min={0}
                max={1}
                step={0.01}
                value={[state.backgroundOpacity || 0]}
                onValueChange={(value: number[]) => updateState({ backgroundOpacity: value[0] })}
                className="w-full"
              />
              <p className="text-center text-xs mt-1">
                {Math.round((state.backgroundOpacity || 0) * 100)}%
              </p>
            </div>

            <Button
              onClick={handleEncode}
              className="my-2 w-full bg-purple-600 hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center p-2 rounded-md shadow-sm text-sm"
            >
              Commit to Basepaint
            </Button>

            <div className="bg-muted p-2 rounded-md shadow-sm">
              <p className="text-xs font-semibold flex items-center">
                <Palette className="mr-1" size={12} aria-hidden="true" />
                Pixels used: <span className="font-variant-numeric tabular-nums ml-1">{pixelCount}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsCustomPaletteOpen(!isCustomPaletteOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Plus className="mr-2" size={16} />Custom Palette</h3>
          {isCustomPaletteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isCustomPaletteOpen && (
          <div className="p-2">
            <CustomPalette
              customPalette={state.customPalette}
              onAddColor={handleAddCustomColor}
              onColorSelect={(color: string) => updateState({ color })}
              currentColor={state.color}
              onClearPalette={handleClearCustomPalette}
            />
          </div>
        )}
      </div>

      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsLayersOpen(!isLayersOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Layers className="mr-2" size={16} />Layers</h3>
          {isLayersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isLayersOpen && (
          <div className="p-2">
            <LayerManager
              state={state}
              addLayer={addLayer}
              removeLayer={removeLayer}
              updateLayerVisibility={updateLayerVisibility}
              updateLayerOpacity={updateLayerOpacity}
              setActiveLayerId={setActiveLayerId}
              updateLayerName={updateLayerName}
            />
          </div>
        )}
      </div>

      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsGridSizeOpen(!isGridSizeOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Grid className="mr-2" size={16} />Grid Size</h3>
          {isGridSizeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isGridSizeOpen && (
          <div className="p-2">
            <Slider
              min={8}
              max={256}
              step={8}
              value={[state.gridSize]}
              onValueChange={(value) => onGridSizeChange(value[0])}
              className="w-full"
            />
            <p className="text-center text-xs mt-1 font-medium">
              <span className="font-variant-numeric tabular-nums">{state.gridSize}</span>x<span className="font-variant-numeric tabular-nums">{state.gridSize}</span>
            </p>
          </div>
        )}
      </div>

      {encodedData && (
        <MintBPButton
          state={state}
          encodedData={encodedData}
          resetEncodedState={resetEncodedState}
          onEncode={handleEncode}
        />
      )}

      <MintPixelminterButton state={state} fps={fps} />
    </div>
  );
};

export default SidePanel;