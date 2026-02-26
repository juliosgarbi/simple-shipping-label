"use client";

import { useState, useCallback } from "react";
import type { Address, Parcel, CreateLabelResponse } from "@/types/shipping";

export function useCreateLabel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateLabelResponse | null>(null);

  const create = useCallback(
    async (from: Address, to: Address, parcel: Parcel) => {
      setError(null);
      setResult(null);
      setLoading(true);
      try {
        const res = await fetch("/api/create-label", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_address: from,
            to_address: to,
            parcel,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create label");
          return;
        }
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { create, loading, error, result };
}
