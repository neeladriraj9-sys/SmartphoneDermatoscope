import { useRef, useState } from "react";
import { Upload, X, Camera, AlertTriangle } from "lucide-react";

interface ImageUploaderProps {
  file: File | null;
  preview: string | null;
  onFileChange: (file: File | null) => void;
}

export const ImageUploader = ({ file, preview, onFileChange }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = (f: File) => {
    setError(null);
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setError("Please upload a JPEG or PNG image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 10MB.");
      return;
    }
    onFileChange(f);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) accept(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) accept(f);
  };

  if (file && preview) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden bg-muted">
          <img src={preview} alt="Selected scan" className="w-full max-h-96 object-contain" />
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="absolute top-2 right-2 bg-card rounded-full p-2 shadow-md"
            aria-label="Remove photo"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{file.name}</span>
          <span>{(file.size / 1024).toFixed(1)} KB</span>
        </div>
        {file.size < 10 * 1024 && (
          <div className="flex gap-2 p-3 rounded-lg bg-risk-watch-bg text-risk-watch-fg text-xs">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>This image might be too dark or blurry. Try taking the photo again in better lighting.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver ? "border-primary bg-primary-light" : "border-border bg-card hover:bg-primary-light/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          className="sr-only"
          onChange={onInput}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
            <Camera size={22} className="text-primary" />
          </div>
          <p className="font-semibold text-sm">Tap to take a photo or drag one in</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Take a clear, close-up photo of the spot. Good lighting, in focus, skin filling most of the frame.
          </p>
          <span className="mt-2 btn-primary text-sm">
            <Upload size={14} className="mr-1.5" /> Choose image
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">JPEG or PNG · up to 10MB</p>
        </div>
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
