import { useState, useEffect } from "react";

interface IUseAutoZoomReturn {
  zoom: number;
  autoZoom: number;
  isManualZoom: boolean;
  setZoom: (z: number) => void;
  setManualZoom: (m: boolean) => void;
}

export const useAutoZoom = (
  containerRef: React.RefObject<HTMLDivElement>
): IUseAutoZoomReturn => {
  const [autoZoom, setAutoZoom] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isManualZoom, setManualZoom] = useState(false);

  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth - 32;
      const newZoom = Math.min(1, w / 794);
      setAutoZoom(newZoom);
      if (!isManualZoom) setZoom(newZoom);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [isManualZoom, containerRef]);

  return { zoom, autoZoom, isManualZoom, setZoom, setManualZoom };
};
