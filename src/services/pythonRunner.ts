declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface PyodideInterface {
  loadPackage: (packages: string | string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<any>;
  runPython: (code: string) => any;
  FS: any;
  globals: any;
}

export class PythonRunner {
  private pyodide: PyodideInterface | null = null;
  private initialized: boolean = false;

  /**
   * Pyodide 초기화
   */
  async initialize(onProgress?: (message: string) => void): Promise<void> {
    if (this.initialized && this.pyodide) {
      return;
    }

    try {
      onProgress?.('Pyodide 로딩 중...');
      
      // Pyodide CDN에서 로드
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });

      this.pyodide = pyodide;

      onProgress?.('필수 패키지 설치 중...');
      
      // pandas, numpy 설치
      await pyodide.loadPackage(['pandas', 'numpy', 'micropip']);

      onProgress?.('Python 환경 설정 중...');
      
      // 기본 import
      await pyodide.runPythonAsync(`
        import pandas as pd
        import numpy as np
        print("✅ Python 환경 준비 완료!")
      `);

      this.initialized = true;
      onProgress?.('✅ 초기화 완료!');
      
    } catch (error) {
      console.error('Pyodide 초기화 실패:', error);
      throw new Error('Python 환경 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
    }
  }

  /**
   * Python 코드 실행
   */
  async runCode(code: string): Promise<{ output: string; executionTime: number }> {
    if (!this.pyodide) {
      throw new Error('Pyodide가 초기화되지 않았습니다.');
    }

    const startTime = performance.now();

    try {
      const result = await this.pyodide.runPythonAsync(code);
      const executionTime = performance.now() - startTime;

      return {
        output: result !== undefined ? String(result) : '',
        executionTime: Math.round(executionTime)
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      throw {
        message: this.formatError(error),
        executionTime: Math.round(executionTime)
      };
    }
  }

  /**
   * 코드 실행 후 마지막 표현식 값 추출 (채점용)
   */
  async runAndExtractResult(code: string): Promise<{ output: string; result: any; executionTime: number }> {
    if (!this.pyodide) {
      throw new Error('Pyodide가 초기화되지 않았습니다.');
    }

    const startTime = performance.now();
    
    try {
      // 코드를 래핑하여 stdout과 결과값 모두 캡처
      const wrappedCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = StringIO()

result = None

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
    
    output = sys.stdout.getvalue()
finally:
    sys.stdout = old_stdout

# result와 output을 딕셔너리로 반환
{'output': output, 'result': result}
`;

      const pyResult = await this.pyodide.runPythonAsync(wrappedCode);
      const executionTime = performance.now() - startTime;
      
      // Python 딕셔너리를 JS 객체로 변환
      const output = pyResult.get('output');
      let result = pyResult.get('result');
      
      // Pyodide Proxy 객체를 JS 값으로 변환
      if (result && typeof result === 'object' && result.toJs) {
        result = result.toJs();
      }
      
      // Pyodide Proxy 객체 정리
      pyResult.destroy();
      
      return {
        output: output || '',
        result: result,
        executionTime: Math.round(executionTime)
      };
    } catch (error: any) {
      const executionTime = performance.now() - startTime;
      throw {
        message: this.formatError(error),
        executionTime: Math.round(executionTime)
      };
    }
  }

  /**
   * CSV 파일을 URL에서 로드하여 DataFrame으로 변환
   */
  async loadCSVFromURL(url: string, variableName: string = 'data'): Promise<string> {
    if (!this.pyodide) {
      throw new Error('Pyodide가 초기화되지 않았습니다.');
    }

    try {
      // URL에서 CSV 다운로드
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CSV 다운로드 실패: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      // Pyodide 가상 파일시스템에 저장
      const filename = `/data_${Date.now()}.csv`;
      this.pyodide.FS.writeFile(filename, csvText);
      
      // pandas로 읽기
      const result = await this.pyodide.runPythonAsync(`
import pandas as pd
${variableName} = pd.read_csv('${filename}')
f"✅ {${variableName}.shape[0]}행 × {${variableName}.shape[1]}열"
      `);
      
      return result;
    } catch (error: any) {
      console.error('CSV 로드 실패:', error);
      throw new Error(`CSV 로드 실패: ${error.message}`);
    }
  }

  /**
   * 에러 메시지 포맷팅
   */
  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      // Python traceback 정리
      const message = error.message;
      const lines = message.split('\n');
      
      // 에러 타입과 메시지만 추출
      const errorLines = lines.filter((line: string) => 
        line.includes('Error:') || 
        line.includes('Exception:') ||
        line.trim().startsWith('File')
      );

      return errorLines.length > 0 ? errorLines.join('\n') : message;
    }

    return '알 수 없는 오류가 발생했습니다.';
  }

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Pyodide 인스턴스 반환
   */
  getPyodide(): PyodideInterface | null {
    return this.pyodide;
  }
}