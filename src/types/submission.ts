export interface Submission {
  id?: string;
  userId: string;
  problemId: string;
  code: string;
  result: {
    userOutput: any;
    expectedOutput: any;
    correct: boolean;
    feedback: string;
  };
  score: number;
  maxScore: number;
  isCorrect: boolean;
  executionTime: number;
  timeSpent: number; // 문제 푸는데 걸린 시간 (초)
  timestamp: Date;
}

export interface ProblemStats {
  id?: string;
  problemId: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageScore: number;
  lastUpdated: Date;
}

export interface UserProgress {
  id?: string;
  userId: string;
  totalSolved: number;
  totalAttempts: number;
  totalScore: number;
  problemsSolved: string[];
  lastActivity: Date;
}