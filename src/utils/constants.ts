// 상수 정의
export const PYODIDE_VERSION = '0.24.1';

export const EXAM_TIME_LIMIT = 180; // 분

export const CODE_TEMPLATES = {
  type1: `import pandas as pd
import numpy as np

# 데이터 로드
# df = pd.read_csv('URL')

# 여기에 코드 작성

result = 0
print(result)
result
`,
  type2: `import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

# 데이터 로드
# train = pd.read_csv('train.csv')
# test = pd.read_csv('test.csv')

# 모델 학습

# result.csv 생성
# result.to_csv('result.csv', index=False)
`,
  type3: `import pandas as pd
import numpy as np
from scipy import stats

# 데이터 로드
# data = pd.read_csv('URL')

# 통계 검정

result = 0
print(result)
result
`
};