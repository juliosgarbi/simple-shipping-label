"use client";

import type { Address } from "@/types/shipping";
import { US_STATES, US_STATE_NAMES, formatZipInput } from "@/utils/address";

interface AddressFormSectionProps {
  title: string;
  value: Address;
  onChange: (address: Address) => void;
  invalidFields?: (keyof Address)[];
}

const inputBase =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-body text-foreground";

export function AddressFormSection({ title, value, onChange, invalidFields }: AddressFormSectionProps) {
  const update = (field: keyof Address, val: string) => {
    onChange({ ...value, [field]: field === "country" ? "US" : val });
  };

  const fieldClass = (field: keyof Address) =>
    invalidFields?.includes(field)
      ? "w-full rounded-md border border-destructive bg-card px-3 py-2 text-body text-foreground"
      : inputBase;

  return (
    <fieldset className="rounded-md border border-border bg-card p-4">
      <legend className="px-2 text-body font-medium text-card-foreground">
        {title}
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label text-muted-foreground">Name</label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => update("name", e.target.value)}
            className={fieldClass("name")}
            placeholder="Full name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label text-muted-foreground">Street address</label>
          <input
            type="text"
            value={value.street1}
            onChange={(e) => update("street1", e.target.value)}
            className={fieldClass("street1")}
            placeholder="Street 1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-label text-muted-foreground">Street address 2 (optional)</label>
          <input
            type="text"
            value={value.street2 ?? ""}
            onChange={(e) => update("street2", e.target.value)}
            className={fieldClass("street2")}
            placeholder="Apt, suite, etc."
          />
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">City</label>
          <input
            type="text"
            value={value.city}
            onChange={(e) => update("city", e.target.value)}
            className={fieldClass("city")}
            placeholder="City"
          />
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">State</label>
          <select
            value={value.state}
            onChange={(e) => update("state", e.target.value)}
            className={fieldClass("state")}
          >
            <option value="">Select state</option>
            {US_STATES.map((code) => (
              <option key={code} value={code}>
                {US_STATE_NAMES[code] ?? code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-label text-muted-foreground">ZIP</label>
          <input
            type="text"
            inputMode="numeric"
            value={value.zip}
            onChange={(e) => update("zip", formatZipInput(e.target.value))}
            className={fieldClass("zip")}
            placeholder="12345 or 12345-6789"
          />
        </div>
      </div>
    </fieldset>
  );
}
