/**
 * Address utilities: US state codes, state/ZIP validation, and ZIP formatting.
 */
export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

/** State code -> display name for dropdowns. */
export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", DC: "District of Columbia",
};

export type StateCode = (typeof US_STATES)[number];

export const US_STATES_SET = new Set<string>(US_STATES);

/** Zip: 5 digits or 5+4 (ZIP+4). Accepts 12345 or 12345-6789 or 123456789. */
export const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export function isValidState(state: string): boolean {
  return US_STATES_SET.has(state.toUpperCase());
}

/** Normalize zip to 5 or 5+4 form. */
export function normalizeZip(zip: string): string {
  const digits = zip.replace(/\D/g, "");
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}

/** Format ZIP input as 12345 or 12345-6789 for display (max 9 digits). */
export function formatZipInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidZip(zip: string): boolean {
  return ZIP_REGEX.test(normalizeZip(zip));
}
