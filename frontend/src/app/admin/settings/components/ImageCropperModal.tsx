"use client";

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface ImageCropperModalProps {
  image: string;
  onConfirm: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ image, onConfirm, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onConfirm(croppedAreaPixels);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col scale-in-center animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Crop Profile Photo</h3>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-slate-500"></i>
          </button>
        </div>

        <div className="relative h-80 bg-slate-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
             <div className="flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wide uppercase">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
             </div>
             <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0A3D8F]"
             />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-[#0A3D8F] text-white text-sm font-semibold rounded-lg hover:bg-[#083170] shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Apply Crop
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
