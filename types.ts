export type AppView = 'home' | 'prep-flow' | 'prep-script' | 'prep-eval' | 'live';

export type QAItem = { q: string; a: string };

export interface PresentationConfig {
  topic: string;
  rawContent: string;
  slideContent: string; 
  reportContent?: string;
  docsContent?: string;
  audience: "expert" | "general";
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

export interface EvaluationCriterion {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface EvaluationResult {
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  criteria: EvaluationCriterion[];
  improvements: string[];
}

export interface LiveScriptStep {
  slideId: number;
  title: string;
  originalContent: string;
  duration: number; // seconds
  keywords: string[]; // 7 keywords to detect
  wrapUpSentence: string; // Suggested sentence when time is running out
  transitionSentence: string; // Suggested sentence to move to next slide
}

export interface LiveSessionData {
  totalDuration: number;
  steps: LiveScriptStep[];
}