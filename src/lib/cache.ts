// Shared cache tags for unstable_cache entries. Mutations call
// revalidateTag(...) with these so cached reads refresh immediately.
export const CACHE_TAGS = {
  bookings: "bookings",
  income: "income",
  expenses: "expenses",
} as const;

// Fallback time-based revalidation (seconds) in case a tag is ever missed.
export const CACHE_REVALIDATE = 300;
