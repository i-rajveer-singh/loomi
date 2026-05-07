export interface TelemetryData {
  timeToSend: number;
  charsPerSecond: number;
  interkeypressLatency: number;
}

const DISTORTION_WORDS = ["never", "always", "everything", "ruined", "impossible", "can't", "hate"];

export function calculateReceptivity(text: string, telemetry: TelemetryData): number {
  let score = 0.5;
  const normalized = (text ?? "").toLowerCase();
  const distortionPattern = new RegExp(`\\b(${DISTORTION_WORDS.join("|")})\\b`);

  if (distortionPattern.test(normalized)) score -= 0.2;

  if (telemetry.charsPerSecond > 8) score -= 0.15;
  else if (telemetry.charsPerSecond < 3) score += 0.15;

  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}
