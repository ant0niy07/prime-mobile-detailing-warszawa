import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { Dictionary } from "../i18n";
import { validatePhoto } from "../lib/quote";
export type Photo = { file: File; url: string; id: string };
export function PhotoPicker({
  photos,
  onChange,
  t,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  t: Dictionary["form"];
}) {
  const [error, setError] = useState("");
  return (
    <div className="photo-picker">
      <label className="upload" htmlFor="photos">
        <ImagePlus size={30} />
        <strong>{t.photos}</strong>
        <span>{t.photoHint}</span>
        <input
          className="sr-only"
          id="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-describedby="photo-note photo-error"
          onChange={(e) => {
            const next = [...photos];
            const errors: string[] = [];
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
            setError([...new Set(errors)].join(" "));
            e.target.value = "";
          }}
        />
      </label>
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
              onClick={() => {
                URL.revokeObjectURL(p.url);
                onChange(photos.filter((x) => x.id !== p.id));
              }}
            >
              <X size={16} />
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
