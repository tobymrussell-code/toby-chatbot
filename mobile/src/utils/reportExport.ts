import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { Report } from "../types/domain";
import { devError, devLog } from "./log";

function buildPlainTextSummary(report: Report): string {
  const r = report.reportJson;
  const lines: string[] = [];
  lines.push("YOUR RENOVATION ADVISOR REPORT");
  lines.push(`${r.summary.roomType} • ${r.summary.goal} • ${r.summary.styleDirection}`);
  lines.push("");
  lines.push(`Recommended project level: ${r.summary.recommendedProjectLevel}`);
  lines.push(`Priority score: ${r.summary.priorityScore}/10`);
  lines.push(`Best next move: ${r.summary.bestNextMove}`);
  lines.push("");
  lines.push("PRIORITY CHECKLIST");
  r.priorityChecklist.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.task} — ${item.costRange} (${item.difficulty}, ${item.impact} impact)`);
  });
  lines.push("");
  lines.push("ESTIMATED BUDGET");
  lines.push(`Minimum Prep: ${r.budget.minimumPrep}`);
  lines.push(`Smart Refresh: ${r.budget.smartRefresh}`);
  lines.push(`Full Transformation: ${r.budget.fullTransformation}`);
  lines.push("");
  lines.push("FINAL RECOMMENDATION");
  lines.push(r.finalRecommendation);
  lines.push("");
  lines.push(r.disclaimer);
  return lines.join("\n");
}

export async function saveReportLocally(report: Report): Promise<string> {
  try {
    const dir = new Directory(Paths.document, "design-on-a-dime-reports");
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, `report-${report.id}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(report, null, 2));
    devLog("report saved locally", file.uri);
    return file.uri;
  } catch (err) {
    devError("saveReportLocally failed", err);
    throw new Error("We could not save that report on this device.");
  }
}

export async function shareReportSummary(report: Report): Promise<void> {
  try {
    const dir = new Directory(Paths.cache, "design-on-a-dime-share");
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, `renovation-report-${report.id}.txt`);
    if (file.exists) file.delete();
    file.create();
    file.write(buildPlainTextSummary(report));

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      throw new Error("Sharing is not available on this device.");
    }
    await Sharing.shareAsync(file.uri, { mimeType: "text/plain", dialogTitle: "Share your renovation report" });
  } catch (err) {
    devError("shareReportSummary failed", err);
    throw new Error("We could not share that report. Please try again.");
  }
}
