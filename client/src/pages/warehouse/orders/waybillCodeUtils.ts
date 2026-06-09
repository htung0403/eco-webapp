/** Mã bill dạng STT: ECO-1, ECO-2, … ECO-123456789 */
export const ECO_BILL_CODE_PATTERN = /^ECO-?(\d+)$/i;

export function formatEcoBillCode(sequence: number): string {
  return `ECO-${Math.max(1, Math.floor(sequence))}`;
}

export function maxEcoBillSequence(codes: string[]): number {
  return codes.reduce((max, code) => {
    const match = code.trim().match(ECO_BILL_CODE_PATTERN);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

export function nextEcoBillCodeFromCodes(codes: string[]): string {
  return formatEcoBillCode(maxEcoBillSequence(codes) + 1);
}
