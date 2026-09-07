/** Masks the middle of a matched string, e.g. "jane.doe@acme.com" -> "j••••••m". */
export function maskSample(sample: string): string {
  if (sample.length <= 4) return sample[0] + '•'.repeat(sample.length - 1);
  const hidden = Math.min(8, sample.length - 2);
  return sample[0] + '•'.repeat(hidden) + sample[sample.length - 1];
}
