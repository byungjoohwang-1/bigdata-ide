import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Submission, ProblemStats, UserProgress } from '../../types/submission';

const SUBMISSIONS_COLLECTION = 'submissions';
const PROBLEM_STATS_COLLECTION = 'problemStats';
const USER_PROGRESS_COLLECTION = 'userProgress';

class SubmissionService {
  // 제출 기록 저장
  async saveSubmission(submission: Omit<Submission, 'id' | 'timestamp'>): Promise<string> {
    try {
      const submissionData = {
        ...submission,
        timestamp: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(db, SUBMISSIONS_COLLECTION),
        submissionData
      );

      // 통계 업데이트 (비동기로 처리)
      this.updateProblemStats(submission.problemId, submission.isCorrect, submission.score);
      this.updateUserProgress(submission.userId, submission.problemId, submission.isCorrect, submission.score);

      return docRef.id;
    } catch (error: any) {
      console.error('제출 저장 실패:', error);
      throw new Error('제출 기록 저장에 실패했습니다: ' + error.message);
    }
  }

  // 문제별 통계 업데이트
  private async updateProblemStats(
    problemId: string, 
    isCorrect: boolean, 
    score: number
  ): Promise<void> {
    try {
      const statsRef = doc(db, PROBLEM_STATS_COLLECTION, problemId);
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        // 첫 제출 - 새 문서 생성
        await updateDoc(statsRef, {
          problemId,
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          successRate: isCorrect ? 100 : 0,
          averageScore: score,
          lastUpdated: Timestamp.now()
        });
      } else {
        // 기존 통계 업데이트
        const stats = statsDoc.data() as ProblemStats;
        const newTotalAttempts = stats.totalAttempts + 1;
        const newCorrectAttempts = stats.correctAttempts + (isCorrect ? 1 : 0);
        const newSuccessRate = (newCorrectAttempts / newTotalAttempts) * 100;
        const newAverageScore = 
          ((stats.averageScore * stats.totalAttempts) + score) / newTotalAttempts;

        await updateDoc(statsRef, {
          totalAttempts: increment(1),
          correctAttempts: increment(isCorrect ? 1 : 0),
          successRate: newSuccessRate,
          averageScore: newAverageScore,
          lastUpdated: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('문제 통계 업데이트 실패:', error);
    }
  }

  // 사용자 진도 업데이트
  private async updateUserProgress(
    userId: string,
    problemId: string,
    isCorrect: boolean,
    score: number
  ): Promise<void> {
    try {
      const progressRef = doc(db, USER_PROGRESS_COLLECTION, userId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        // 첫 제출 - 새 문서 생성
        await updateDoc(progressRef, {
          userId,
          totalSolved: isCorrect ? 1 : 0,
          totalAttempts: 1,
          totalScore: score,
          problemsSolved: isCorrect ? [problemId] : [],
          lastActivity: Timestamp.now()
        });
      } else {
        // 기존 진도 업데이트
        const progress = progressDoc.data() as UserProgress;
        const alreadySolved = progress.problemsSolved.includes(problemId);

        await updateDoc(progressRef, {
          totalSolved: increment(isCorrect && !alreadySolved ? 1 : 0),
          totalAttempts: increment(1),
          totalScore: increment(score),
          problemsSolved: isCorrect ? arrayUnion(problemId) : progress.problemsSolved,
          lastActivity: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('사용자 진도 업데이트 실패:', error);
    }
  }

  // 문제별 제출 기록 조회
  async getSubmissionsByProblem(problemId: string, limitCount = 10): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('problemId', '==', problemId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      } as Submission));
    } catch (error: any) {
      console.error('제출 기록 조회 실패:', error);
      throw new Error('제출 기록 조회 실패: ' + error.message);
    }
  }

  // 사용자별 제출 기록 조회
  async getSubmissionsByUser(userId: string, limitCount = 20): Promise<Submission[]> {
    try {
      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      } as Submission));
    } catch (error: any) {
      console.error('제출 기록 조회 실패:', error);
      throw new Error('제출 기록 조회 실패: ' + error.message);
    }
  }

  // 문제 통계 조회
  async getProblemStats(problemId: string): Promise<ProblemStats | null> {
    try {
      const statsRef = doc(db, PROBLEM_STATS_COLLECTION, problemId);
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        return null;
      }

      return {
        id: statsDoc.id,
        ...statsDoc.data(),
        lastUpdated: statsDoc.data().lastUpdated.toDate()
      } as ProblemStats;
    } catch (error: any) {
      console.error('통계 조회 실패:', error);
      return null;
    }
  }

  // 사용자 진도 조회
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const progressRef = doc(db, USER_PROGRESS_COLLECTION, userId);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        return null;
      }

      return {
        id: progressDoc.id,
        ...progressDoc.data(),
        lastActivity: progressDoc.data().lastActivity.toDate()
      } as UserProgress;
    } catch (error: any) {
      console.error('진도 조회 실패:', error);
      return null;
    }
  }
}

export const submissionService = new SubmissionService();