/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Paintbrush, Eraser, Trash2, Grid, RotateCcw, RotateCw, ZoomIn, ZoomOut, PaintBucket, Move, Image, Slash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Feedback } from '../../types/types';

interface ToolPanelProps {
  state: {
    color: string;
    tool: 'brush' | 'eraser' | 'bucket' | 'move' | 'line';
    showGrid: boolean;
    touchEnabled: boolean;
    showReferenceImage: boolean;
  };
  updateState: (newState: Partial<{ tool: 'brush' | 'eraser' | 'bucket' | 'move' | 'line'; color: string; showGrid: boolean; touchEnabled: boolean; showReferenceImage: boolean }>) => void;
  handleHistoryAction: (action: 'undo' | 'redo') => void;
  clearCanvas: () => void;
  handleZoom: (zoomIn: boolean) => void;
  feedback: Feedback;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  state, updateState, handleHistoryAction, clearCanvas, handleZoom, feedback, canUndo, canRedo
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const renderToolButton = (
    icon: React.ElementType,
    title: string,
    onClick: () => void,
    isActive: boolean = false,
    isDisabled: boolean = false
  ) => (
    <Button
      onClick={onClick}
      className={`btn-tool relative ${feedback[title] ? 'scale-100' : ''} `}
      title={title}
      disabled={isClient ? isDisabled : undefined}
    >
      {React.createElement(icon, { className: `h-full w-full ${isActive ? 'text-blue-500' : 'text-gray-400'}` })}
    </Button>
  );

  return (
    <div className="w-10 bg-muted flex flex-col items-center py-3 space-y-2 shadow">
      <div className={`relative ${feedback['colorPicker'] ? 'scale-95' : ''} transition-all duration-200`}>
        <input
          type="color"
          value={state.color}
          onChange={(e) => updateState({ color: e.target.value })}
          className="color-picker"
          title="Choose Color"
        />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            backgroundColor: state.color,
            boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
          }}
        />
      </div>
      {renderToolButton(Paintbrush, "brush", () => updateState({ tool: 'brush' }), state.tool === 'brush')}
      {renderToolButton(Slash, "line", () => updateState({ tool: 'line' }), state.tool === 'line')}
      {renderToolButton(PaintBucket, "bucket", () => updateState({ tool: 'bucket' }), state.tool === 'bucket')}
      {renderToolButton(Eraser, "eraser", () => updateState({ tool: 'eraser' }), state.tool === 'eraser')}
      {renderToolButton(Move, "move", () => {
        updateState({ tool: 'move', touchEnabled: !state.touchEnabled });
      }, state.tool === 'move')}
      {renderToolButton(Grid, "toggleGrid", () => updateState({ showGrid: !state.showGrid }), state.showGrid)}
      {renderToolButton(RotateCcw, "undo", () => handleHistoryAction('undo'), false, isClient && !canUndo)}
      {renderToolButton(RotateCw, "redo", () => handleHistoryAction('redo'), false, isClient && !canRedo)}
      {renderToolButton(Trash2, "clearCanvas", clearCanvas)}
      {renderToolButton(ZoomOut, "zoomOut", () => handleZoom(false))}
      {renderToolButton(ZoomIn, "zoomIn", () => handleZoom(true))}
      {renderToolButton(Image, "toggleReferenceImage", () => updateState({ showReferenceImage: !state.showReferenceImage }), state.showReferenceImage)}
    </div>
  );
};

export default ToolPanel;