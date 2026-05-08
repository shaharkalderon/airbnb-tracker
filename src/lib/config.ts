/**
 * App-wide configuration sourced from env vars.
 * Customers customize their deployment by setting these in Vercel.
 */

export const config = {
  brandName:
    process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "DorisDayInn",
  currencySymbol:
    process.env.NEXT_PUBLIC_CURRENCY_SYMBOL?.trim() || "₪",
  currencyLocale:
    process.env.NEXT_PUBLIC_CURRENCY_LOCALE?.trim() || "en-US",
};
