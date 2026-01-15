import { GeneratedScript, PresentationConfig } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function generateScriptViaBackend(
  config: PresentationConfig & {
    reportContent?: string;
    docsContent?: string;
  },
  files: {
    paper: File;
    report?: File | null;
    docs?: File | null;
  }
): Promise<GeneratedScript> {
  const fd = new FormData();

  // inquired
  fd.append("apiProvider", config.aiTool === "Upstage" ? "upstage" : "ibm");
  fd.append("audience", config.audience === "expert" ? "expert" : "general");
  fd.append("nonverbal", config.useNonVerbal ? "y" : "n");
  fd.append("paper", files.paper);

  // optional
  if (files.report) {
    fd.append("report", files.report);
  }
  if (files.docs) {
    fd.append("docs", files.docs);
  }

  const res = await fetch(`${BASE_URL}/v1/scripts/generate`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t);
  }
  return res.json();
}

export async function downloadScript(jobId: string, format: "txt" | "pdf") {
  const res = await fetch(`${BASE_URL}/v1/scripts/${jobId}/download?format=${format}`);
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();

  // 파일명은 Content-Disposition에서 주는 게 이상적이지만, 프론트에서 fallback 처리
  return blob;
}
