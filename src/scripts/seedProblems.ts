import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// 연습문제
const problem0 = {
  exam: '0',
  type: 1,
  number: 0,
  title: '연습문제: 평균 계산',
  description: `주어진 데이터의 'score' 칼럼 평균을 구하세요.

결과를 소수점 둘째 자리까지 반올림하여 출력하세요.`,
  
  datasets: [
    {
      name: 'data',
      filename: 'practice.csv',
      url: 'data:text/csv;base64,bmFtZSxzY29yZQrsmY3quLDrj5ksODUK6rmA7LKg7IiYLDkwCuydtO2VhOyImCw4NQ==',
      description: 'name, score 데이터',
      variableName: 'data'
    }
  ],
  
  expectedOutput: {
    type: 'number',
    value: 85.0,
    tolerance: 0.1
  },
  
  hints: [
    'df["score"].mean() 사용',
    'np.round(값, 2)로 반올림'
  ],
  
  starterCode: `import pandas as pd
import numpy as np

# 데이터는 'data' 변수에 자동 로드됩니다
# data.head()로 확인 가능!

# 평균 계산
result = np.round(data['score'].mean(), 2)

print(f"평균: {result}")
result
`,
  
  points: 5,
  timeLimit: 300,
  difficulty: 'easy'
};

// 제10회 작업형 제1유형 - 문제 1
const problem1 = {
  exam: '10',
  type: 1,
  number: 1,
  title: '소주제별 정답률 분석',
  description: `소주제별로 정답률을 구하고, 3번째로 높은 정답률을 구하시오.

정답률 = 정답여부가 1인 응답 수 / 해당 소주제 전체 응답 수

※ 동일한 정답률은 하나의 순위로 간주합니다.
※ 공동 1등이 2명 있으면 그 다음 순위는 2등으로 처리합니다.`,
  
  datasets: [
    {
      name: 'data',
      filename: '10_1_1.csv',
      url: 'https://raw.githubusercontent.com/YoungjinBD/data/main/exam/10_1_1.csv',
      description: '학생ID, 문제ID, 대주제, 소주제, 정답여부',
      variableName: 'data'
    }
  ],
  
  expectedOutput: {
    type: 'number',
    value: 0.68,
    tolerance: 0.01
  },
  
  hints: [
    'groupby()로 소주제별 그룹화',
    'sum() / count()로 정답률 계산',
    'sort_values() + unique()로 중복 제거',
    '3번째 값은 unique_values[2]'
  ],
  
  starterCode: `import pandas as pd
import numpy as np

# 데이터는 'data' 변수에 자동 로드됩니다
# 여기에 코드를 작성하세요

# 1. 소주제별 정답률 계산
# numer = data.groupby(['소주제'])['정답여부'].sum()
# denom = data.groupby(['소주제'])['정답여부'].count()
# ratio = (numer / denom)

# 2. 정답률 내림차순 정렬 후 중복 제거
# unique_ratios = sorted(ratio.unique(), reverse=True)

# 3. 3번째로 높은 정답률
# result = unique_ratios[2]

# print(f"3번째로 높은 정답률: {result}")
# result
`,
  
  points: 10,
  timeLimit: 600,
  difficulty: 'easy'
};

// 제10회 작업형 제1유형 - 문제 2
const problem2 = {
  exam: '10',
  type: 1,
  number: 2,
  title: '연도-월별 매출 분석',
  description: `date를 연도(year), 월(month)로 분리하여 연도-월별 price의 합계를 구하시오.

① 두 번째로 큰 매출액(합계)을 구하시오.
② 네 번째로 큰 price 합계에 해당하는 연도-월을 찾으시오.
③ 해당 연도-월에서 카테고리별 price 합계 중 가장 높은 값을 정수로 제출하시오.`,
  
  datasets: [
    {
      name: 'data',
      filename: '10_1_2.csv',
      url: 'https://raw.githubusercontent.com/YoungjinBD/data/main/exam/10_1_2.csv',
      description: 'date, category, item, price',
      variableName: 'data'
    }
  ],
  
  expectedOutput: {
    type: 'number',
    value: 1012500,
    tolerance: 1
  },
  
  hints: [
    'pd.to_datetime()으로 날짜 변환',
    'dt.year, dt.month로 년월 추출',
    'groupby()로 집계',
    'sort_values()로 정렬'
  ],
  
  starterCode: `import pandas as pd
import numpy as np

# 데이터는 'data' 변수에 자동 로드됩니다
# 여기에 코드를 작성하세요

`,
  
  points: 10,
  timeLimit: 600,
  difficulty: 'medium'
};

export async function seedProblems() {
  try {
    console.log('📝 문제 등록 시작...');
    
    const problemsRef = collection(db, 'problems');
    
    // 연습문제
    const doc0 = await addDoc(problemsRef, problem0);
    console.log('✅ 연습문제 등록:', doc0.id);
    
    // 실전문제 1
    const doc1 = await addDoc(problemsRef, problem1);
    console.log('✅ 문제 1 등록:', doc1.id);
    
    // 실전문제 2
    const doc2 = await addDoc(problemsRef, problem2);
    console.log('✅ 문제 2 등록:', doc2.id);
    
    console.log('🎉 모든 문제 등록 완료!');
    return { success: true, count: 3 };
  } catch (error) {
    console.error('❌ 문제 등록 실패:', error);
    throw error;
  }
}