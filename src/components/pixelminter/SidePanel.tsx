/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ColorPalette from './ColorPalette';
import CustomPalette from './CustomPalette';
import ConnectWalletButton from './ConnectWalletButton';
import LayerManager from './LayerPanel';
import { State, BrushData } from '../../types/types';
import { Palette, Grid, Save, Droplet, Layers, Plus, Play, Download } from 'lucide-react';
import { useSidePanelLogic } from '../../hooks/useSidePanelLogic';
import { usePixelCountAndDroplets } from '../../hooks/usePixelCount';
import MintBPButton from './MintBPButton';
import MintPixelminterButton from './MintPixelminterButton';
import { encodePixelData } from '../../utils/encodingUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useExportGif } from '../../hooks/useExportGif';

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
  fps: number;
  setFps: (fps: number) => void;
  toggleOnionSkinning: () => void;
  updateOnionSkinningOpacity: (opacity: number) => void;
  onionSkinningCanvas: React.RefObject<HTMLCanvasElement>;
  showFrames: boolean;
  setShowFrames: (show: boolean) => void;
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
  toggleOnionSkinning,
  updateOnionSkinningOpacity,
  onionSkinningCanvas,
  fps,
  setFps,
  showFrames,
  setShowFrames
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
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const initialDroplets = useMemo(() => brushData?.pixelsPerDay || state.pixelsPerDay || 0, [brushData, state.pixelsPerDay]);

  const { pixelCount, droplets } = usePixelCountAndDroplets(state, initialDroplets);

  const resetEncodedState = () => {
    setEncodedData(null);
  };

  const handleEncode = () => {
    const data = encodePixelData(state);
    setEncodedData(data);
  };

  const { exportGif } = useExportGif(state, fps);
  const handleDownloadGif = useCallback(async () => {
    try {
      const gifBlob = await exportGif();
      const url = URL.createObjectURL(gifBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'animation.gif';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar el GIF:', error);
    }
  }, [exportGif]);

  return (
    <div
      id='side-panel'
      className="w-full max-w-xs flex-grow p-3 bg-muted space-y-3 h-full overflow-y-auto text-white "
      onionSkinningCanvas={onionSkinningCanvas}
      toggleOnionSkinning={toggleOnionSkinning}
      updateOnionSkinningOpacity={updateOnionSkinningOpacity}
    >
      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsBasepaintOpen(!isBasepaintOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Palette className="mr-2" size={16} />
            Basepaint
            {isClient && state.palette.length > 0 && (
              `: ${state.theme}`
            )}
          </h3>
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
                className="h-8 w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center py-1 px-2 rounded-md shadow-sm text-sm"
              >
                {state.isPaletteLoading ? 'Loading...' : 'Get Today\'s Palette'}
              </Button>
            </div>

            {isClient && state.palette.length > 0 && (
              <div className="mt-4">
                <ColorPalette
                  onColorSelect={(color: string) => updateState({ color })}
                  palette={state.palette}
                  theme={state.theme}
                />
              </div>
            )}

            <div className="mt-3">
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

            <div className="mt-3 bg-muted p-2 rounded-md shadow-sm">
              <p className="text-xs font-semibold flex items-center">
                Pixels used: <span className="font-variant-numeric tabular-nums ml-1">{pixelCount}</span>
              </p>
            </div>

            <Button
              onClick={handleEncode}
              className="h-8 mt-2 w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center p-2 rounded-md shadow-sm text-sm"
            >
              <Save className="mr-1" size={12} aria-hidden="true" />
              Prepare to Mint
            </Button>

            {encodedData && (
              <MintBPButton
                state={state}
                encodedData={encodedData}
                resetEncodedState={resetEncodedState}
                onEncode={handleEncode}
              />
            )}
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
          <div className="px-2 pb-2">
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

      <div className="tool-container rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          className="w-full p-2 flex justify-between items-center text-left"
        >
          <h3 className="text-xs font-semibold flex items-center"><Play className="mr-2" size={16} />Timeline</h3>
          {isTimelineOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isTimelineOpen && (
          <div className="p-2">
            <div className="border-t py-1 flex justify-between items-center">
              <span className="text-xs font-semibold mb-1">Show Frames</span>
              <Switch
                checked={showFrames}
                onCheckedChange={setShowFrames}
                className="scale-75 data-[state=checked]:bg-blue-500"
              />
            </div>

            <div className="border-t pt-2 pb-3 flex flex-col space-y-2">
              <label htmlFor="onionSkinningOpacity" className="text-xs font-semibold mb-1">
                {fps} FPS
              </label>
              <Slider
                min={1} max={30} step={1} value={[fps]}
                onValueChange={value => setFps(value[0])}
                className="w-full"
              />
            </div>

            <div className="border-t py-2 flex flex-col space-y-2">
              <label htmlFor="onionSkinningOpacity" className="text-xs font-semibold mb-1">
                Onion Skinning Opacity
              </label>
              <Slider
                id="onionSkinningOpacity"
                min={0}
                max={1}
                step={0.1}
                value={[state.onionSkinningOpacity]}
                onValueChange={(value) => updateOnionSkinningOpacity(value[0])}
                className="w-full"
              />
            </div>

            <Button onClick={handleDownloadGif} className="mt-3 w-full inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground text-xs py-0 px-2 h-6 bg-muted hover:bg-gray-300">
              <Download className="mr-2" size={14} />
              Download GIF
            </Button>
          </div>



        )}
      </div>

      <MintPixelminterButton state={state} fps={fps} />
    </div>
  );
};

export default SidePanel;