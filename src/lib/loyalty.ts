export const POINTS_PER_DOLLAR_EARNED = 1;
export const POINTS_PER_DOLLAR_REDEEMED = 20;

export function pointsToDiscount(points: number): number {
  return Math.round((points / POINTS_PER_DOLLAR_REDEEMED) * 100) / 100;
}

export function amountToPointsEarned(amount: number): number {
  return Math.floor(amount * POINTS_PER_DOLLAR_EARNED);
}
