import { useState, type ChangeEvent } from "react";
import { ImagePlus, Camera, X } from "lucide-react";
import type { Dictionary } from "../i18n";
import { validatePhoto } from "../lib/quote";
import { pricing } from "../config/pricing";
import { track } from "../lib/tracking";
import type { Photo } from "../lib/photos";
export type { Photo } from "../lib/photos";
export function PhotoPicker({
  photos,
  onChange,
  t,
}: {
  photos: Photo[];
  onChange: (p: Photo[]) => void;
  t: Dictionary["form"];
}) {
  const [error, setError] = useState("");
  const select = (e: ChangeEvent<HTMLInputElement>) => {
    const next = [...photos],
      errors: string[] = [];
    for (const file of Array.from(e.target.files || [])) {
      const problem = validatePhoto(file, next.length, t);
      if (problem) errors.push(problem);
      else
        next.push({
          file,
          url: URL.createObjectURL(file),
          id: crypto.randomUUID(),
        });
    }
    onChange(next);
    track("upload_photos", { count: next.length });
    setError([...new Set(errors)].join(" "));
    e.target.value = "";
  };
  return (
    <div className="photo-picker">
      <p className="note">{t.photoGuide}</p>
      <label className="upload" htmlFor="photos">
        <ImagePlus size={28} />
        <strong>{t.photos}</strong>
        <span>{t.photoHint}</span>
        <input
          className="sr-only"
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-describedby="photo-note photo-error"
          onChange={select}
        />
      </label>
      <div className="photo-tools">
        <label className="text-button camera-button">
          <Camera size={17} />
          {t.camera}
          <input
            className="sr-only"
            aria-label={t.camera}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={select}
          />
        </label>
        <span aria-live="polite">
          {photos.length} / {pricing.maxPhotos}
        </span>
      </div>
      <p id="photo-error" role="alert" className="error">
        {error}
      </p>
      <div className="photo-grid">
        {photos.map((p) => (
          <div className="photo-thumb" key={p.id}>
            <img src={p.url} alt={p.file.name} width="120" height="90" />
            <button
              type="button"
              aria-label={`${t.remove}: ${p.file.name}`}
              onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
            >
              <X size={17} />
            </button>
            <span>{p.file.name}</span>
          </div>
        ))}
      </div>
      <p className="note" id="photo-note">
        {t.photoNote}
      </p>
    </div>
  );
}
