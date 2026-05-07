/**
 * Single source of truth for resume/document filename generation.
 * Format: {CandidateName}_{JobPosition}[_{suffix}].{ext}
 * Example: Fahad_Sabzwari_Lead_Full_Stack_Engineer.pdf
 */
export function generateResumeFilename(
  candidateName: string,
  jobPosition: string,
  suffix?: string,
  ext = 'pdf',
): string {
  const sanitize = (s: string) =>
    (s ?? '')
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 60);

  const parts = [sanitize(candidateName), sanitize(jobPosition)];
  if (suffix) parts.push(suffix);
  const filtered = parts.filter(Boolean);
  return filtered.length ? `${filtered.join('_')}.${ext}` : `Resume.${ext}`;
}
