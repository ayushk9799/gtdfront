export const FREE_CASE_LIMIT = 2;
export const FREE_CASE_LIMIT_CODE = 'FREE_CASE_LIMIT_REACHED';

export const getFreeCaseUsage = (userData) => {
  const reservedCount = Array.isArray(userData?.freeCaseAccessKeys)
    ? new Set(userData.freeCaseAccessKeys).size
    : 0;
  const completedCount = (userData?.completedCases || []).length
    + (userData?.completedDailyChallenges || []).length;
  return Math.max(reservedCount, completedCount);
};

export const hasReachedFreeCaseLimit = (userData) =>
  getFreeCaseUsage(userData) >= FREE_CASE_LIMIT;
