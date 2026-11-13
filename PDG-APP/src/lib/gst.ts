/** Australian GST charged on top of the service amount. */
export const GST_RATE = 0.1;
export const GST_LABEL = "GST (10%)";

export type GstBreakdown = {
  subtotal: number;
  gst: number;
  total: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Splits a pre-tax amount into subtotal, GST and total (rounded to cents). */
export function gstBreakdown(subtotal: unknown): GstBreakdown {
  const base = round2(Number(subtotal) || 0);
  const gst = round2(base * GST_RATE);
  return { subtotal: base, gst, total: round2(base + gst) };
}
