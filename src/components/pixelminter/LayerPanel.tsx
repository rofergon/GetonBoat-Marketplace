/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Trash } from 'lucide-react';
import { State, Layer } from '../../types/types';
import { Input } from "@/components/ui/input";
import { getCurrentLayers } from '../../hooks/pixelminter/layerStateManager';

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
      <div className="flex items-center justify-between mb pb-2">
        <Button onClick={addLayer} className="text-xs py-0 px-2 h-6 bg-muted hover:bg-gray-300">
          Add Layer
        </Button>
      </div>
      {layers.map((layer: Layer) => (
        <div key={layer.id} className="flex items-center justify-between p border-t text-xs">
          {editingLayerId === layer.id ? (
            <Input
              value={layer.name}
              onChange={(e) => updateLayerName(layer.id, e.target.value)}
              onBlur={() => setEditingLayerId(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingLayerId(null)}
              autoFocus
              className="flex-grow mr-2 h-6 text-xs bg-muted text-white focus:border-blue-500 [&:focus]:shadow-none [&:focus-visible]:ring-0 [&:focus-visible]:ring-offset-0"
            />
          ) : (
            <span
              className={`flex-grow mr-2 truncate cursor-pointer ${layer.id === state.activeLayerId ? 'font-bold text-blue-400' : ''}`}
              onClick={() => setActiveLayerId(layer.id)}
              onDoubleClick={() => setEditingLayerId(layer.id)}
            >
              {layer.name}
            </span>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              checked={layer.visible}
              onCheckedChange={(checked) => updateLayerVisibility(layer.id, checked)}
              className="scale-75"
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
              size="icon"
              className="h-6 w-6 hover:text-red-600 rounded bg-transparent hover:bg-transparent text-muted-foreground"
            >
              <Trash size={12} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LayerManager;