export type AppView = 'home' | 'prep-flow' | 'prep-script' | 'live';

export type QAItem = { q: string; a: string };

export interface PresentationConfig {
  topic: string;
  rawContent: string;
  audience: "non-expert" | "expert";
  style: "easy" | "professional";
  aiTool: "IBM-Watson" | "Upstage";
  useNonVerbal: boolean;
}

export interface ScriptSection {
  title: string;
  content: string;
  duration: number; // seconds
  keyMessages: string[];
  qa: QAItem[];
  cue?: string; // Non-verbal cue
}

export interface GeneratedScript {
  jobId: string;
  fileStem: string;
  keywords: string[];
  totalTime: number;
  sections: ScriptSection[];
}

export interface FlowSummary {
  steps: {
    title: string;
    description: string;
    keyPoint: string;
  }[];
}