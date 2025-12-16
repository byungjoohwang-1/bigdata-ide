export interface Dataset {
  name: string;
  filename: string;
  url: string;
  description: string;
  variableName?: string; // Python에서 사용할 변수명 (선택적)
}

export interface ExpectedOutput {
  type: 'number' | 'string' | 'dataframe';
  value: any;
  tolerance?: number;
}

export interface Problem {
  id?: string;
  exam: string;
  type: number;
  number: number;
  title: string;
  description: string;
  datasets: Dataset[];
  expectedOutput: ExpectedOutput;
  hints: string[];
  starterCode: string;
  points: number;
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SubmissionResult {
  correct: boolean;
  score: number;
  output: any;
  expected: any;
  executionTime: number;
  error?: string;
}