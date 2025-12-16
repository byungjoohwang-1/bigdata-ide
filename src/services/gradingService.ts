import { ExpectedOutput } from '../types/problem';

export interface GradingResult {
  correct: boolean;
  score: number;
  userOutput: any;
  expectedOutput: any;
  feedback: string;
  executionTime: number;
}

export class GradingService {
  /**
   * 사용자 출력값을 채점
   */
  grade(
    userOutput: any,
    expected: ExpectedOutput,
    points: number,
    executionTime: number
  ): GradingResult {
    let correct = false;
    let feedback = '';

    try {
      // 타입별 채점
      switch (expected.type) {
        case 'number':
          correct = this.gradeNumber(userOutput, expected);
          break;
        case 'string':
          correct = this.gradeString(userOutput, expected);
          break;
        case 'dataframe':
          correct = this.gradeDataFrame(userOutput, expected);
          break;
        default:
          feedback = '❌ 지원하지 않는 출력 타입입니다.';
      }

      // 피드백 생성
      if (correct) {
        feedback = '✅ 정답입니다!';
      } else {
        feedback = this.generateFeedback(userOutput, expected);
      }

      return {
        correct,
        score: correct ? points : 0,
        userOutput,
        expectedOutput: expected.value,
        feedback,
        executionTime
      };
    } catch (error: any) {
      return {
        correct: false,
        score: 0,
        userOutput,
        expectedOutput: expected.value,
        feedback: `❌ 채점 오류: ${error.message}`,
        executionTime
      };
    }
  }

  /**
   * 숫자형 채점
   */
  private gradeNumber(userOutput: any, expected: ExpectedOutput): boolean {
    const user = this.parseNumber(userOutput);
    const exp = this.parseNumber(expected.value);
    const tolerance = expected.tolerance || 0.01;

    if (user === null || exp === null) {
      return false;
    }

    return Math.abs(user - exp) <= tolerance;
  }

  /**
   * 문자열 채점
   */
  private gradeString(userOutput: any, expected: ExpectedOutput): boolean {
    const user = String(userOutput).trim();
    const exp = String(expected.value).trim();
    return user === exp;
  }

  /**
   * DataFrame 채점 (추후 구현)
   */
  private gradeDataFrame(userOutput: any, expected: ExpectedOutput): boolean {
    // TODO: DataFrame 비교 로직
    return false;
  }

  /**
   * 숫자 파싱 헬퍼
   */
  private parseNumber(value: any): number | null {
    if (typeof value === 'number') {
      return value;
    }
    
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * 피드백 생성
   */
  private generateFeedback(userOutput: any, expected: ExpectedOutput): string {
    let feedback = '❌ 오답입니다.\n\n';
    feedback += `📊 제출한 답: ${userOutput}\n`;
    feedback += `✅ 정답: ${expected.value}\n\n`;

    if (expected.type === 'number') {
      const user = this.parseNumber(userOutput);
      const exp = this.parseNumber(expected.value);
      
      if (user !== null && exp !== null) {
        const diff = Math.abs(user - exp);
        feedback += `차이: ${diff.toFixed(4)}\n`;
        feedback += `허용 오차: ${expected.tolerance || 0.01}\n`;
      }
    }

    feedback += '\n💡 힌트를 참고하여 다시 시도해보세요!';
    return feedback;
  }
}

// 싱글톤 인스턴스
export const gradingService = new GradingService();