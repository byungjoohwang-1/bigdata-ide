import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { Problem } from '../../types/problem';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFAnalysisResult {
  totalPages: number;
  extractedText: string;
  suggestedProblems: Partial<Problem>[];
}

class PDFService {
  /**
   * PDF 파일을 Firebase Storage에 업로드
   */
  async uploadPDF(file: File, userId: string = 'admin'): Promise<string> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `pdfs/${userId}/${timestamp}_${sanitizedFileName}`;
      
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ PDF 업로드 성공:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('PDF 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * PDF 파일에서 텍스트 추출 및 분석
   */
  async analyzePDF(file: File): Promise<PDFAnalysisResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const totalPages = pdf.numPages;

      // 최대 20페이지까지 텍스트 추출
      for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      // 문제 추출
      const suggestedProblems = this.extractProblemsFromText(fullText);

      return {
        totalPages,
        extractedText: fullText.substring(0, 5000),
        suggestedProblems
      };
    } catch (error) {
      console.error('PDF 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 텍스트에서 문제 추출
   */
  private extractProblemsFromText(text: string): Partial<Problem>[] {
    const problems: Partial<Problem>[] = [];
    
    // 회차 정보 추출
    const examPattern = /(\d+)회/g;
    const examMatches = [...text.matchAll(examPattern)];
    const examNumber = examMatches.length > 0 ? parseInt(examMatches[0][1]) : 1;
    const exam = examNumber.toString();

    // 작업형1 패턴
    const type1Pattern = /작업형\s*제?\s*1\s*유형|Type\s*1/gi;
    const type1Matches = [...text.matchAll(type1Pattern)];
    
    type1Matches.forEach((_, index) => {
      problems.push({
        exam,
        type: 1,
        number: index + 1,
        title: `${exam}회 작업형 제1유형 문제 ${index + 1}`,
        description: 'PDF에서 추출된 문제입니다. 실제 내용을 확인하고 수정해주세요.',
        points: 10,
        timeLimit: 300,
        starterCode: `import pandas as pd
import numpy as np

# 여기에 코드를 작성하세요

result = 0.0
result`,
        expectedOutput: { type: 'number', value: 0.0 } as any,
        hints: ['데이터를 확인하세요', '필요한 함수를 사용하세요'],
        datasets: []
      });
    });

    // 작업형2 패턴
    const type2Pattern = /작업형\s*제?\s*2\s*유형|Type\s*2/gi;
    const type2Matches = [...text.matchAll(type2Pattern)];
    
    type2Matches.forEach((_, index) => {
      problems.push({
        exam,
        type: 2,
        number: index + 1,
        title: `${exam}회 작업형 제2유형 문제 ${index + 1}`,
        description: 'PDF에서 추출된 문제입니다. 실제 내용을 확인하고 수정해주세요.',
        points: 40,
        timeLimit: 600,
        starterCode: `import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# 여기에 코드를 작성하세요

result = 0.0
result`,
        expectedOutput: { type: 'number', value: 0.0 } as any,
        hints: ['데이터를 확인하세요', '적절한 모델을 선택하세요'],
        datasets: []
      });
    });

    // 작업형3 패턴
    const type3Pattern = /작업형\s*제?\s*3\s*유형|Type\s*3/gi;
    const type3Matches = [...text.matchAll(type3Pattern)];
    
    type3Matches.forEach((_, index) => {
      problems.push({
        exam,
        type: 3,
        number: index + 1,
        title: `${exam}회 작업형 제3유형 문제 ${index + 1}`,
        description: 'PDF에서 추출된 문제입니다. 실제 내용을 확인하고 수정해주세요.',
        points: 50,
        timeLimit: 600,
        starterCode: `import pandas as pd
import numpy as np
from scipy import stats

# 여기에 코드를 작성하세요

result = 0.0
result`,
        expectedOutput: { type: 'number', value: 0.0 } as any,
        hints: ['가설을 설정하세요', '적절한 검정 방법을 선택하세요'],
        datasets: []
      });
    });

    // 문제가 없으면 기본 문제 1개 생성
    if (problems.length === 0) {
      problems.push({
        exam: '1',
        type: 1,
        number: 1,
        title: 'PDF에서 추출된 문제',
        description: 'PDF 분석 결과입니다. 실제 내용을 확인하고 수정해주세요.',
        points: 10,
        timeLimit: 300,
        starterCode: `import pandas as pd
import numpy as np

result = 0.0
result`,
        expectedOutput: { type: 'number', value: 0.0 } as any,
        hints: ['문제 내용을 확인하세요'],
        datasets: []
      });
    }

    return problems;
  }

  /**
   * Firebase에 문제 저장
   */
  async saveProblemsToFirebase(
    problems: Partial<Problem>[],
    pdfUrl: string
  ): Promise<string[]> {
    const problemIds: string[] = [];

    for (const problem of problems) {
      try {
        const docRef = await addDoc(collection(db, 'problems'), {
          ...problem,
          pdfUrl,
          createdAt: Timestamp.now(),
          source: 'pdf_upload'
        });
        problemIds.push(docRef.id);
      } catch (error) {
        console.error('문제 저장 실패:', error);
        throw error;
      }
    }

    return problemIds;
  }

  /**
   * PDF 업로드 및 문제 등록 (전체 프로세스)
   */
  async uploadAndRegisterProblems(
    file: File,
    userId: string = 'admin'
  ): Promise<{ problemIds: string[]; count: number; pdfUrl: string }> {
    try {
      // 1. PDF 분석
      const analysis = await this.analyzePDF(file);
      
      // 2. PDF 업로드
      const pdfUrl = await this.uploadPDF(file, userId);
      
      // 3. 문제 저장
      const problemIds = await this.saveProblemsToFirebase(
        analysis.suggestedProblems,
        pdfUrl
      );
      
      return {
        problemIds,
        count: problemIds.length,
        pdfUrl
      };
    } catch (error) {
      console.error('PDF 처리 실패:', error);
      throw error;
    }
  }
}

export const pdfService = new PDFService();