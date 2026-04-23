import { zxcvbnOptions, zxcvbn } from "@zxcvbn-ts/core";
import * as zxcvbnCommon from "@zxcvbn-ts/language-common";
import * as zxcvbnEn from "@zxcvbn-ts/language-en";

let configured = false;
function configure() {
  if (configured) return;
  zxcvbnOptions.setOptions({
    translations: zxcvbnEn.translations,
    graphs: zxcvbnCommon.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommon.dictionary,
      ...zxcvbnEn.dictionary,
    },
  });
  configured = true;
}

export type StrengthLabel = "empty" | "weak" | "fair" | "strong";

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: StrengthLabel;
  crackSeconds: number;
  warning?: string;
  suggestions: string[];
}

export function analyzeStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: "empty", crackSeconds: 0, suggestions: [] };
  }
  configure();
  const r = zxcvbn(password.slice(0, 200));
  const score = r.score as 0 | 1 | 2 | 3 | 4;
  const label: StrengthLabel = score <= 1 ? "weak" : score === 2 ? "fair" : "strong";
  const crackSeconds =
    typeof r.crackTimesSeconds?.offlineSlowHashing1e4PerSecond === "number"
      ? r.crackTimesSeconds.offlineSlowHashing1e4PerSecond
      : 0;
  return {
    score,
    label,
    crackSeconds,
    warning: r.feedback.warning || undefined,
    suggestions: r.feedback.suggestions ?? [],
  };
}
