"use client";

/**
 * BarcodeScanner — camera overlay that decodes a barcode and calls onDetected.
 *
 * Uses @zxing/browser (BrowserMultiFormatReader) for cross-browser support.
 * The overlay covers the full screen with a centred viewfinder crop guide.
 */
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const detectedRef = useRef(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        // Prefer rear camera on mobile
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const rear = devices.find((d) =>
          /back|rear|environment/i.test(d.label)
        ) ?? devices[0];

        if (!rear) {
          setError("No camera found on this device.");
          return;
        }

        await reader.decodeFromVideoDevice(
          rear.deviceId,
          videoRef.current!,
          (result, err) => {
            if (detectedRef.current) return;
            if (result) {
              detectedRef.current = true;
              setScanning(false);
              onDetected(result.getText());
            } else if (err && !(err instanceof NotFoundException)) {
              console.warn("[BarcodeScanner]", err);
            }
          }
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/permission|denied/i.test(msg)) {
          setError("Camera permission denied. Please allow camera access and try again.");
        } else {
          setError(`Could not start camera: ${msg}`);
        }
      }
    })();

    return () => {
      // Stop all tracks
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [onDetected]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full"
        style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
        aria-label="Close scanner"
      >
        <X size={20} />
      </button>

      <p className="text-white text-sm font-medium mb-4 opacity-80">
        Point camera at a barcode
      </p>

      {/* Viewfinder */}
      <div className="relative rounded-2xl overflow-hidden" style={{ width: 300, height: 220 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {/* Scan line animation */}
        {scanning && !error && (
          <div
            className="absolute left-0 right-0 h-0.5 animate-scan-line"
            style={{ background: "var(--accent, #c9952a)", opacity: 0.9 }}
          />
        )}
        {/* Corner guides */}
        {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos) => (
          <div
            key={pos}
            className={`absolute w-6 h-6 ${pos}`}
            style={{
              borderTop: pos.includes("top") ? "3px solid #fff" : undefined,
              borderBottom: pos.includes("bottom") ? "3px solid #fff" : undefined,
              borderLeft: pos.includes("left") ? "3px solid #fff" : undefined,
              borderRight: pos.includes("right") ? "3px solid #fff" : undefined,
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center max-w-xs px-4">{error}</p>
      )}
      {!scanning && !error && (
        <p className="mt-4 text-green-400 text-sm font-medium">✓ Barcode detected — looking up…</p>
      )}

      <p className="mt-4 text-white/40 text-xs">Supports EAN-13 · UPC-A · QR</p>

      {/* Scan line keyframe */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite; position: absolute; }
      `}</style>
    </div>
  );
}
