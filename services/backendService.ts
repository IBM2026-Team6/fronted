import { GeneratedScript, PresentationConfig } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function generateScriptViaBackend(config: PresentationConfig, paperFile: File): Promise<GeneratedScript> {
  const fd = new FormData();
  fd.append("apiProvider", config.aiTool === "Upstage" ? "upstage" : "ibm");
  fd.append("paper", paperFile);

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
