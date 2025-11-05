/**
 * Advisor Types and Interfaces
 */

export interface AdvisorContext {
  /** Current task or problem being worked on */
  task: string;
  
  /** What we think we're doing */
  intention?: string;
  
  /** What we've actually done */
  implementation?: string;
  
  /** Key assumptions we're making */
  assumptions?: string[];
  
  /** Constraints we're working within */
  constraints?: string[];
  
  /** Stage of work (planning, executing, reviewing, delivering) */
  stage?: 'planning' | 'executing' | 'reviewing' | 'delivering';
  
  /** Additional context */
  metadata?: Record<string, unknown>;
}

export interface AdvisorFeedback {
  /** Which advisor provided this feedback */
  advisor: AdvisorType;
  
  /** Main insights */
  insights: string[];
  
  /** Concerns or warnings */
  concerns: string[];
  
  /** Questions to consider */
  questions: string[];
  
  /** Actionable recommendations */
  recommendations: string[];
  
  /** Severity: info, warning, critical */
  severity: 'info' | 'warning' | 'critical';
  
  /** Confidence in feedback (0-1) */
  confidence: number;
}

export interface QualityGateResult {
  /** Overall pass/fail */
  passed: boolean;
  
  /** Feedback from each advisor */
  advisorFeedback: AdvisorFeedback[];
  
  /** Critical issues that must be addressed */
  criticalIssues: string[];
  
  /** Warnings to consider */
  warnings: string[];
  
  /** Overall quality score (0-100) */
  qualityScore: number;
  
  /** Summary of findings */
  summary: string;
}

export type AdvisorType =
  | 'skeptic'
  | 'pattern-hunter'
  | 'mirror'
  | 'oracle'
  | 'interrogator'
  | 'validator'
  | 'outsider';

export interface AdvisorPromptTemplate {
  systemPrompt: string;
  userPromptTemplate: (context: AdvisorContext) => string;
  focusAreas: string[];
  typicalOutputs: string[];
}

/**
 * Advisor agent definition
 */
export interface AdvisorAgent {
  type: AdvisorType;
  name: string;
  role: string;
  capabilities: string[];
  whenToInvoke: string[];
  promptTemplate: AdvisorPromptTemplate;
}
