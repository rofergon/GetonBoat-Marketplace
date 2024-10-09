/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Layers, X } from 'lucide-react';
import { State, Layer } from '../../types/types';
import { Input } from "@/components/ui/input";
import { getCurrentLayers } from '../../hooks/layerStateManager';

interface LayerManagerProps {
  state: State;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayerVisibility: (id: string, visible: boolean) => void;
  updateLayerOpacity: (id: string, opacity: number) => void;
  setActiveLayerId: (id: string) => void;
  updateLayerName: (id: string, name: string) => void;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  state,
  addLayer,
  removeLayer,
  updateLayerVisibility,
  updateLayerOpacity,
  setActiveLayerId,
  updateLayerName
}) => {
  const layers = getCurrentLayers(state);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-700">
        <Button onClick={addLayer} className="text-xs py-0 px-2 h-6 bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white">
          Add Layer
        </Button>
      </div>
      {layers.map((layer: Layer) => (
        <div key={layer.id} className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700 text-xs">
          {editingLayerId === layer.id ? (
            <Input
              value={layer.name}
              onChange={(e) => updateLayerName(layer.id, e.target.value)}
              onBlur={() => setEditingLayerId(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingLayerId(null)}
              autoFocus
              className="flex-grow mr-2 h-6 text-xs bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            />
          ) : (
            <span
              className={`flex-grow mr-2 truncate cursor-pointer ${layer.id === state.activeLayerId ? 'font-bold text-blue-400' : 'text-gray-300'}`}
              onClick={() => setActiveLayerId(layer.id)}
              onDoubleClick={() => setEditingLayerId(layer.id)}
            >
              {layer.name}
            </span>
          )}
          <div className="flex items-center space-x-1">
            <Switch
              checked={layer.visible}
              onCheckedChange={(checked) => updateLayerVisibility(layer.id, checked)}
              className="h-4 w-7"
            />
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[layer.opacity]}
              onValueChange={(value) => updateLayerOpacity(layer.id, value[0])}
              className="w-14"
            />
            <Button
              onClick={() => removeLayer(layer.id)}
              disabled={layers.length === 1}
              variant="destructive"
              size="icon"
              className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              <X size={10} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LayerManager;