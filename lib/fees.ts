export const SUCCESS_FEE_PERCENTAGE = 5;

export function calculateSuccessFee(savings: number): number {
  if (!Number.isFinite(savings) || savings <= 0) {
    return 0;
  }

  return Math.round((savings * SUCCESS_FEE_PERCENTAGE) / 100);
}
