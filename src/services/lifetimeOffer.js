export const LIFETIME_OFFER_DURATION_MS = 12 * 60 * 60 * 1000;

export const getCurrentLifetimeOfferStart = (storedStart, now = Date.now()) => {
  if (!Number.isFinite(storedStart) || storedStart <= 0) return null;

  const elapsed = Math.max(now - storedStart, 0);
  if (elapsed < LIFETIME_OFFER_DURATION_MS) return storedStart;

  const completedWindows = Math.floor(elapsed / LIFETIME_OFFER_DURATION_MS);
  return storedStart + (completedWindows * LIFETIME_OFFER_DURATION_MS);
};
