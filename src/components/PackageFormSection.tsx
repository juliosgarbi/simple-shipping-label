"use client";

import type { Parcel } from "@/types/shipping";

interface PackageFormSectionProps {
  value: Parcel;
  onChange: (parcel: Parcel) => void;
  invalidFields?: (keyof Parcel)[];
}

const inputBase =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-body text-foreground";

export function PackageFormSection({ value, onChange, invalidFields }: PackageFormSectionProps) {
  const update = (field: keyof Parcel, val: number) => {
    onChange({ ...value, [field]: val });
  };

  const fieldClass = (field: keyof Parcel) =>
    invalidFields?.includes(field)
      ? "w-full rounded-md border border-destructive bg-card px-3 py-2 text-body text-foreground"
      : inputBase;

  return (
    <fieldset className="rounded-md border border-border bg-card p-4">
      <legend className="px-2 text-body font-medium text-card-foreground">
        Package
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-label text-muted-foreground">Weight (oz)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={value.weight || ""}
            onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
            className={fieldClass("weight")}
            placeholder="e.g. 16"
          />
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">Length (in)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={value.length || ""}
            onChange={(e) => update("length", parseFloat(e.target.value) || 0)}
            className={fieldClass("length")}
            placeholder="e.g. 8"
          />
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">Width (in)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={value.width || ""}
            onChange={(e) => update("width", parseFloat(e.target.value) || 0)}
            className={fieldClass("width")}
            placeholder="e.g. 5"
          />
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">Height (in)</label>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={value.height || ""}
            onChange={(e) => update("height", parseFloat(e.target.value) || 0)}
            className={fieldClass("height")}
            placeholder="e.g. 5"
          />
        </div>
      </div>
      <p className="mt-2 text-caption text-muted-foreground">
        Weight in ounces; dimensions in inches. All three dimensions required.
      </p>
    </fieldset>
  );
}
