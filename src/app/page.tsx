"use client";

import { useState } from "react";
import { AddressFormSection } from "@/components/AddressFormSection";
import { PackageFormSection } from "@/components/PackageFormSection";
import { useCreateLabel } from "@/hooks/useCreateLabel";
import { isValidState, isValidZip } from "@/utils/address";
import type { Address, Parcel } from "@/types/shipping";

const emptyAddress: Address = {
  name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

const emptyParcel: Parcel = {
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
};

function printLabel(labelUrl: string) {
  const w = window.open(labelUrl, "_blank", "noopener,noreferrer");
  if (w) {
    w.onload = () => w.print();
  } else {
    window.location.href = labelUrl;
  }
}

type AddressField = keyof Pick<Address, "name" | "street1" | "city" | "state" | "zip">;
type ParcelField = keyof Parcel;

function validateAddress(a: Address, label: string): { message: string; field: AddressField } | null {
  if (!a.name?.trim()) return { message: `${label}: Name is required`, field: "name" };
  if (!a.street1?.trim()) return { message: `${label}: Street address is required`, field: "street1" };
  if (!a.city?.trim()) return { message: `${label}: City is required`, field: "city" };
  if (!a.state?.trim()) return { message: `${label}: State is required`, field: "state" };
  if (!isValidState(a.state)) return { message: `${label}: Invalid state code`, field: "state" };
  if (!a.zip?.trim()) return { message: `${label}: ZIP is required`, field: "zip" };
  if (!isValidZip(a.zip)) return { message: `${label}: ZIP must be 5 or 9 digits (12345 or 12345-6789)`, field: "zip" };
  return null;
}

function validateParcel(p: Parcel): { message: string; fields: ParcelField[] } | null {
  if (typeof p.weight !== "number" || p.weight <= 0) {
    return { message: "Package weight must be greater than 0 (ounces)", fields: ["weight"] };
  }
  if (typeof p.length !== "number" || p.length <= 0 || typeof p.width !== "number" || p.width <= 0 || typeof p.height !== "number" || p.height <= 0) {
    return { message: "Package length, width, and height must be greater than 0 (inches)", fields: ["length", "width", "height"] };
  }
  return null;
}

export default function Home() {
  const [from, setFrom] = useState<Address>({ ...emptyAddress });
  const [to, setTo] = useState<Address>({ ...emptyAddress });
  const [parcel, setParcel] = useState<Parcel>({ ...emptyParcel });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invalidFrom, setInvalidFrom] = useState<AddressField[] | null>(null);
  const [invalidTo, setInvalidTo] = useState<AddressField[] | null>(null);
  const [invalidParcel, setInvalidParcel] = useState<ParcelField[] | null>(null);

  const { create, loading, error, result } = useCreateLabel();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInvalidFrom(null);
    setInvalidTo(null);
    setInvalidParcel(null);
    const fromErr = validateAddress(from, "From address");
    if (fromErr) {
      setValidationError(fromErr.message);
      setInvalidFrom([fromErr.field]);
      return;
    }
    const toErr = validateAddress(to, "To address");
    if (toErr) {
      setValidationError(toErr.message);
      setInvalidTo([toErr.field]);
      return;
    }
    const parcelErr = validateParcel(parcel);
    if (parcelErr) {
      setValidationError(parcelErr.message);
      setInvalidParcel(parcelErr.fields);
      return;
    }
    create(from, to, parcel);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-heading font-semibold text-foreground">
          USPS Shipping Label
        </h1>
        <p className="mt-1 text-body text-muted-foreground">
          Enter US addresses and package details to generate a label.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <AddressFormSection title="From address" value={from} onChange={setFrom} invalidFields={invalidFrom ?? undefined} />
          <AddressFormSection title="To address" value={to} onChange={setTo} invalidFields={invalidTo ?? undefined} />
          <PackageFormSection value={parcel} onChange={setParcel} invalidFields={invalidParcel ?? undefined} />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate label"}
          </button>
        </form>

        {/* Result area */}
        <section className="mt-8">
          {loading && (
            <div className="flex items-center justify-center rounded-lg border border-border bg-muted py-12">
              <span className="text-body text-muted-foreground">Creating shipment…</span>
            </div>
          )}

          {(validationError || error) && !loading && (
            <div
              className="rounded-lg border border-destructive bg-destructive-muted p-4 text-body text-destructive-foreground"
              role="alert"
            >
              {validationError ?? error}
            </div>
          )}

          {result && !loading && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-body font-medium text-card-foreground">
                Your label is ready.
                {result.tracking_code && (
                  <span className="ml-2 text-muted-foreground">Tracking: {result.tracking_code}</span>
                )}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1 overflow-hidden rounded border border-border bg-card">
                  {/* Label URL is typically PDF; object/iframe works for display and print */}
                  <object
                    data={result.label_url}
                    type="application/pdf"
                    className="h-[400px] w-full"
                    aria-label="Shipping label"
                  >
                    <p className="p-4 text-body text-muted-foreground">
                      <a href={result.label_url} target="_blank" rel="noopener noreferrer">
                        Open label in new tab
                      </a>
                    </p>
                  </object>
                </div>
                <div className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => printLabel(result.label_url)}
                    className="rounded-lg bg-primary px-4 py-2 text-body font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Print label
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !result && (
            <p className="text-center text-body text-muted-foreground">
              Enter addresses and package details, then click Generate label.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
