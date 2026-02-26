import { NextResponse } from "next/server";
import EasyPost from "@easypost/api";
import type { CreateLabelRequest, CreateLabelResponse } from "@/types/shipping";
import { isValidState, isValidZip, normalizeZip } from "@/utils/address";

/**
 * Validates the request body for create-label. Ensures from/to US addresses and parcel (weight in oz, dimensions in inches).
 * @returns Validated and normalized data, or an error message.
 */
export function validateRequest(body: unknown): { ok: true; data: CreateLabelRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body is required" };
  }

  const b = body as Record<string, unknown>;
  const from = b.from_address as unknown;
  const to = b.to_address as unknown;
  const parcel = b.parcel as unknown;

  if (!from || typeof from !== "object" || !to || typeof to !== "object" || !parcel || typeof parcel !== "object") {
    return { ok: false, error: "from_address, to_address, and parcel are required" };
  }

  const addr = (a: Record<string, unknown>): string | null => {
    if (!a.state || typeof a.state !== "string") return "State is required";
    if (!isValidState(a.state)) return "Invalid state code";
    if (!a.zip || typeof a.zip !== "string") return "ZIP is required";
    if (!isValidZip(a.zip)) return "ZIP must be 5 or 9 digits (12345 or 12345-6789)";
    if (!a.street1 || typeof a.street1 !== "string" || !a.street1.trim()) return "Street address is required";
    if (!a.city || typeof a.city !== "string" || !a.city.trim()) return "City is required";
    if (!a.name || typeof a.name !== "string" || !a.name.trim()) return "Name is required";
    return null;
  };

  const fromErr = addr(from as Record<string, unknown>);
  if (fromErr) return { ok: false, error: `From address: ${fromErr}` };
  const toErr = addr(to as Record<string, unknown>);
  if (toErr) return { ok: false, error: `To address: ${toErr}` };

  const p = parcel as Record<string, unknown>;
  const w = typeof p.weight === "number" ? p.weight : Number(p.weight);
  const len = typeof p.length === "number" ? p.length : Number(p.length);
  const wid = typeof p.width === "number" ? p.width : Number(p.width);
  const h = typeof p.height === "number" ? p.height : Number(p.height);

  if (Number.isNaN(w) || w <= 0) return { ok: false, error: "Package weight must be a positive number (ounces)" };
  if (Number.isNaN(len) || len <= 0 || Number.isNaN(wid) || wid <= 0 || Number.isNaN(h) || h <= 0) {
    return { ok: false, error: "Package length, width, and height must be positive numbers (inches)" };
  }

  const data: CreateLabelRequest = {
    from_address: {
      name: (from as Record<string, string>).name.trim(),
      street1: (from as Record<string, string>).street1.trim(),
      street2: (from as Record<string, string>).street2?.trim(),
      city: (from as Record<string, string>).city.trim(),
      state: (from as Record<string, string>).state.toUpperCase(),
      zip: normalizeZip((from as Record<string, string>).zip),
      country: "US",
    },
    to_address: {
      name: (to as Record<string, string>).name.trim(),
      street1: (to as Record<string, string>).street1.trim(),
      street2: (to as Record<string, string>).street2?.trim(),
      city: (to as Record<string, string>).city.trim(),
      state: (to as Record<string, string>).state.toUpperCase(),
      zip: normalizeZip((to as Record<string, string>).zip),
      country: "US",
    },
    parcel: { weight: w, length: len, width: wid, height: h },
  };

  return { ok: true, data };
}

/**
 * POST /api/create-label – creates a USPS shipment via EasyPost and returns the label URL and optional tracking code.
 * Body: { from_address, to_address, parcel }. Requires EASYPOST_API_KEY.
 */
export async function POST(request: Request) {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "EasyPost API key is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateRequest(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { from_address, to_address, parcel } = validated.data;
  const client = new EasyPost(apiKey);

  try {
    const shipment = new client.Shipment({
      from_address: {
        name: from_address.name,
        street1: from_address.street1,
        street2: from_address.street2,
        city: from_address.city,
        state: from_address.state,
        zip: from_address.zip,
        country: from_address.country,
      },
      to_address: {
        name: to_address.name,
        street1: to_address.street1,
        street2: to_address.street2,
        city: to_address.city,
        state: to_address.state,
        zip: to_address.zip,
        country: to_address.country,
      },
      parcel: {
        weight: parcel.weight,
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
      },
    });

    await shipment.save();

    const uspsRate = shipment.lowestRate?.(["USPS"]) ?? shipment.rates?.find((r: { carrier: string }) => r.carrier === "USPS") ?? shipment.rates?.[0];
    if (!uspsRate) {
      return NextResponse.json({ error: "No USPS rate available for this shipment" }, { status: 400 });
    }

    await shipment.buy(uspsRate);
    const labelUrl = shipment.postage_label?.label_url;
    if (!labelUrl) {
      return NextResponse.json({ error: "Label URL not returned by EasyPost" }, { status: 502 });
    }

    const response: CreateLabelResponse = {
      label_url: labelUrl,
      tracking_code: shipment.tracking_code ?? undefined,
    };
    return NextResponse.json(response);
  } catch (err) {
    const nested = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
    const message =
      nested ?? (err instanceof Error ? err.message : "EasyPost request failed");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
