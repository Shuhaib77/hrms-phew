'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClear: () => void;
  capturedBlob: Blob | null;
}

export function CameraCapture({ onCapture, capturedBlob, onClear }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreaming(true);
    } catch (err: any) {
      setError(err.message || 'Camera access denied');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, 'image/jpeg', 0.85);

    stopCamera();
  };

  const retake = () => {
    onClear();
    startCamera();
  };

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-center">
        <Camera className="h-8 w-8 mx-auto text-error mb-2" />
        <p className="text-sm text-error">{error}</p>
        <Button size="sm" variant="secondary" className="mt-2" onClick={startCamera}>
          <RefreshCw className="h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

  if (capturedBlob) {
    return (
      <div className="text-center">
        <img
          src={URL.createObjectURL(capturedBlob)}
          alt="Captured"
          className="w-48 h-48 object-cover rounded-xl mx-auto border-2 border-success"
        />
        <p className="text-xs text-success mt-1 flex items-center justify-center gap-1">
          <Check className="h-3 w-3" /> Photo captured
        </p>
        <Button size="sm" variant="ghost" className="mt-1" onClick={retake}>
          <RefreshCw className="h-3 w-3" /> Retake
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <video
          ref={videoRef}
          className="w-48 h-48 object-cover rounded-xl bg-surface-secondary mx-auto"
          playsInline
          muted
        />
        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="sm" onClick={startCamera}>
              <Camera className="h-4 w-4" /> Start Camera
            </Button>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {streaming && (
        <Button size="sm" className="mt-2" onClick={capture}>
          <Camera className="h-4 w-4" /> Capture Photo
        </Button>
      )}
    </>
  );
}
