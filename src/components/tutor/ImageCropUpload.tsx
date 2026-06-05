import React, { useState, useRef, useCallback } from 'react';
import { RotateCw, Crop, Check, X } from 'lucide-react';
import { useLearningStyleStore } from '../../store/learningStyleStore';

interface ImageCropUploadProps {
  onImageReady: (base64: string | null) => void;
  currentImage: string | null;
  children?: React.ReactNode;
}

/** Nén ảnh client-side */
async function compressImage(dataUrl: string, maxWidth = 1600, quality = 0.85): Promise<string> {
  const { dataSaver } = useLearningStyleStore.getState();
  const w = dataSaver ? 1200 : maxWidth;
  const q = dataSaver ? 0.7 : quality;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, w / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', q));
    };
    img.src = dataUrl;
  });
}

/** Xoay 90° */
async function rotateImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  });
}

const ImageCropUpload: React.FC<ImageCropUploadProps> = ({
  onImageReady,
  currentImage,
  children,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [cropMode, setCropMode] = useState(false);
  const [cropPercent, setCropPercent] = useState(80);

  const processFile = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPreview(compressed);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const applyCrop = async () => {
    if (!preview) return;
    const img = new Image();
    img.onload = async () => {
      const size = Math.min(img.width, img.height) * (cropPercent / 100);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      const cropped = await compressImage(canvas.toDataURL('image/jpeg', 0.9));
      setPreview(cropped);
      setCropMode(false);
      onImageReady(cropped);
    };
    img.src = preview;
  };

  const handleRotate = async () => {
    if (!preview) return;
    const rotated = await rotateImage(preview);
    setPreview(rotated);
  };

  return (
    <div>
      {children}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processFile(f);
        }}
      />

      {preview && (
        <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src={preview} alt="Preview đề bài" className="max-h-52 w-full object-contain bg-slate-100 dark:bg-slate-800" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={handleRotate}
              className="w-8 h-8 bg-white/90 dark:bg-slate-800 rounded-full flex items-center justify-center shadow"
              aria-label="Xoay 90 độ"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onImageReady(null);
              }}
              className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
              aria-label="Xóa ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {cropMode && preview && (
        <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium flex items-center gap-2 mb-3">
            <Crop className="w-4 h-4" /> Cắt vùng đề ({cropPercent}%)
          </p>
          <input
            type="range"
            min="50"
            max="100"
            value={cropPercent}
            onChange={(e) => setCropPercent(Number(e.target.value))}
            className="w-full accent-brand-600 mb-3"
          />
          <button
            type="button"
            onClick={applyCrop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold"
          >
            <Check className="w-4 h-4" /> Dùng ảnh này
          </button>
        </div>
      )}

      {!preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:border-brand-400"
        >
          Chọn ảnh đề (có crop & xoay)
        </button>
      )}
    </div>
  );
};

export default ImageCropUpload;
