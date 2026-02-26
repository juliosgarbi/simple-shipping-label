import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateRequest, POST } from "./route";

vi.mock("@easypost/api", () => ({
  default: class MockEasyPost {
    Shipment = class {
      postage_label: { label_url: string } | null = null;
      tracking_code: string | undefined = undefined;
      rates = [{ carrier: "USPS", id: "rate_1" }];

      lowestRate() {
        return { carrier: "USPS", id: "rate_1" };
      }
      async save() {
        return this;
      }
      async buy() {
        this.postage_label = { label_url: "https://example.com/label.pdf" };
        this.tracking_code = "TRACK123";
        return this;
      }
    };
  },
}));

const validAddress = {
  name: "Jane Doe",
  street1: "123 Main St",
  street2: "",
  city: "San Francisco",
  state: "CA",
  zip: "94102",
  country: "US" as const,
};

const validParcel = {
  weight: 16,
  length: 8,
  width: 5,
  height: 5,
};

const validBody = {
  from_address: validAddress,
  to_address: { ...validAddress, name: "John Doe", street1: "456 Oak Ave", zip: "90210" },
  parcel: validParcel,
};

describe("validateRequest", () => {
  it("returns error when body is null", () => {
    const result = validateRequest(null);
    expect(result).toEqual({ ok: false, error: "Request body is required" });
  });

  it("returns error when body is not an object", () => {
    expect(validateRequest(undefined)).toEqual({ ok: false, error: "Request body is required" });
    expect(validateRequest("string")).toEqual({ ok: false, error: "Request body is required" });
    expect(validateRequest(42)).toEqual({ ok: false, error: "Request body is required" });
  });

  it("returns error when from_address, to_address or parcel is missing", () => {
    expect(validateRequest({})).toEqual({
      ok: false,
      error: "from_address, to_address, and parcel are required",
    });
    expect(validateRequest({ from_address: validAddress })).toEqual({
      ok: false,
      error: "from_address, to_address, and parcel are required",
    });
  });

  it("returns error for invalid from address - state", () => {
    const body = {
      ...validBody,
      from_address: { ...validAddress, state: "" },
    };
    expect(validateRequest(body)).toEqual({ ok: false, error: "From address: State is required" });

    const bodyInvalidState = {
      ...validBody,
      from_address: { ...validAddress, state: "XX" },
    };
    expect(validateRequest(bodyInvalidState)).toEqual({
      ok: false,
      error: "From address: Invalid state code",
    });
  });

  it("returns error for invalid from address - zip, street1, city, name", () => {
    expect(validateRequest({ ...validBody, from_address: { ...validAddress, zip: "" } })).toEqual({
      ok: false,
      error: "From address: ZIP is required",
    });
    expect(validateRequest({ ...validBody, from_address: { ...validAddress, zip: "1234" } })).toEqual({
      ok: false,
      error: "From address: ZIP must be 5 or 9 digits (12345 or 12345-6789)",
    });
    expect(validateRequest({ ...validBody, from_address: { ...validAddress, street1: "" } })).toEqual({
      ok: false,
      error: "From address: Street address is required",
    });
    expect(validateRequest({ ...validBody, from_address: { ...validAddress, city: "" } })).toEqual({
      ok: false,
      error: "From address: City is required",
    });
    expect(validateRequest({ ...validBody, from_address: { ...validAddress, name: "" } })).toEqual({
      ok: false,
      error: "From address: Name is required",
    });
  });

  it("returns error for invalid to address", () => {
    expect(validateRequest({ ...validBody, to_address: { ...validAddress, state: "XX" } })).toEqual({
      ok: false,
      error: "To address: Invalid state code",
    });
  });

  it("returns error for invalid parcel", () => {
    expect(validateRequest({ ...validBody, parcel: { ...validParcel, weight: 0 } })).toEqual({
      ok: false,
      error: "Package weight must be a positive number (ounces)",
    });
    expect(validateRequest({ ...validBody, parcel: { ...validParcel, length: -1 } })).toEqual({
      ok: false,
      error: "Package length, width, and height must be positive numbers (inches)",
    });
  });

  it("returns ok and normalized data when valid", () => {
    const result = validateRequest(validBody);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.from_address.state).toBe("CA");
      expect(result.data.from_address.zip).toBe("94102");
      expect(result.data.to_address.zip).toBe("90210");
      expect(result.data.parcel.weight).toBe(16);
    }
  });

  it("normalizes zip to ZIP+4 format when 9 digits", () => {
    const body = {
      ...validBody,
      from_address: { ...validAddress, zip: "941021234" },
    };
    const result = validateRequest(body);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.from_address.zip).toBe("94102-1234");
  });
});

describe("POST /api/create-label", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/create-label", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    process.env.EASYPOST_API_KEY = "test-key";
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty("error", "Invalid JSON body");
  });

  it("returns 400 with validation error when body fails validateRequest", async () => {
    const req = new Request("http://localhost/api/create-label", {
      method: "POST",
      body: JSON.stringify({ from_address: validAddress }),
      headers: { "Content-Type": "application/json" },
    });
    process.env.EASYPOST_API_KEY = "test-key";
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("from_address, to_address, and parcel are required");
  });

  it("returns 500 when EASYPOST_API_KEY is not set", async () => {
    delete process.env.EASYPOST_API_KEY;
    const req = new Request("http://localhost/api/create-label", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("EasyPost API key is not configured");
  });

  it("returns 200 with label_url and tracking_code when EasyPost succeeds", async () => {
    process.env.EASYPOST_API_KEY = "test-key";
    const req = new Request("http://localhost/api/create-label", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("label_url", "https://example.com/label.pdf");
    expect(data).toHaveProperty("tracking_code", "TRACK123");
  });
});
