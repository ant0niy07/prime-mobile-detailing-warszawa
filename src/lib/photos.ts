import { useSyncExternalStore } from "react";
export type Photo = { file: File; url: string; id: string };
let photos: Photo[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => photos;
export function setPhotos(next: Photo[]) {
  for (const p of photos)
    if (!next.some((n) => n.id === p.id)) URL.revokeObjectURL(p.url);
  photos = next;
  listeners.forEach((listener) => listener());
}
export function clearPhotos() {
  setPhotos([]);
}
/** In-memory only: survives modal closure/locale changes, never stored or uploaded. Browser unload releases URLs. */
export function usePhotoSession() {
  return [
    useSyncExternalStore(subscribe, snapshot, snapshot),
    setPhotos,
  ] as const;
}
