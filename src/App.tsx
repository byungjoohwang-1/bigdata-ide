import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  Typography, 
  CircularProgress, 
  Button,
  Drawer,
  IconButton,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { CodeEditor } from './components/Editor/CodeEditor';
import { ProblemList } from './components/ProblemList/ProblemList';
import { Timer } from './components/Timer/Timer';
import { ProblemStatsCard } from './components/Stats/ProblemStatsCard';
import { PDFUploadDialog } from './components/PDFUpload/PDFUploadDialog';
import { usePyodide } from './hooks/usePyodide';
import { useProblems } from './hooks/useProblems';
import { useTimer } from './hooks/useTimer';
import { seedProblems } from './scripts/seedProblems';
import { gradingService, GradingResult } from './services/gradingService';
import { submissionService } from './services/firebase/submissionService';
import { Problem } from './types/problem';
import { Submission } from './types/submission';
import './App.css';

const STARTER_CODE = `import pandas as pd
import numpy as np

# 간단한 계산
result = 0.68
print(f"결과: {result}")

result
`;

function App() {
  const { runner, loading, error, progress } = usePyodide();
  const { problems, loading: problemsLoading, reload: reloadProblems } = useProblems();
  
  const [code, setCode] = useState(STARTER_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false); // PDF 다이얼로그 상태
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  
  // 타이머 훅
  const timer = useTimer(selectedProblem?.timeLimit || 300);
  
  // 사용자 ID (실제로는 로그인 시스템에서 가져옴)
  const [userId] = useState('user_' + Date.now());
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);

  // 타이머 만료 시 알림
  useEffect(() => {
    if (timer.isExpired && selectedProblem) {
      alert('⏰ 시간이 초과되었습니다!\n그래도 계속 풀이할 수 있습니다.');
    }
  }, [timer.isExpired, selectedProblem]);

  // 문제 등록 함수
  const handleSeedProblems = async () => {
    try {
      setOutput('📝 문제 등록 중...\n');
      const result = await seedProblems();
      setOutput(prev => prev + `\n✅ ${result.count}개 문제 등록 완료!\n`);
      alert('✅ 샘플 문제가 등록되었습니다!');
      await reloadProblems();
    } catch (err: any) {
      setOutput(prev => prev + '\n❌ 오류: ' + err.message);
      alert('❌ 문제 등록 실패: ' + err.message);
    }
  };

  // PDF 업로드 성공 시 콜백
  const handlePDFUploadSuccess = async () => {
    await reloadProblems();
  };

  // 문제 선택 함수
  const handleSelectProblem = async (problem: Problem) => {
    setSelectedProblem(problem);
    setCode(problem.starterCode);
    setDrawerOpen(false);
    setGradingResult(null);
    
    // 타이머 리셋 및 시작
    timer.reset(problem.timeLimit);
    timer.start();
    
    // 문제 시작 시간 기록
    setProblemStartTime(Date.now());
    
    let outputText = `📋 문제 선택됨: ${problem.title}\n\n`;
    outputText += `📖 설명:\n${problem.description}\n\n`;
    outputText += `💡 힌트:\n${problem.hints.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}\n\n`;
    
    // CSV 데이터 자동 로드
    if (problem.datasets && problem.datasets.length > 0 && runner) {
      outputText += '━━━━━━━━━━━━━━━━━━━━━━\n';
      outputText += '📥 데이터 로드 중...\n\n';
      setOutput(outputText);

      try {
        for (const dataset of problem.datasets) {
          const varName = dataset.variableName || dataset.name || 'data';
          const shape = await runner.loadCSVFromURL(dataset.url, varName);
          outputText += `✅ ${dataset.filename} → ${varName}\n`;
          outputText += `   ${shape}\n\n`;
        }
        outputText += '━━━━━━━━━━━━━━━━━━━━━━\n';
        outputText += '🎯 데이터가 준비되었습니다!\n';
        outputText += '💻 코드를 작성하고 "실행" 버튼을 눌러주세요!\n';
      } catch (err: any) {
        outputText += `\n❌ 데이터 로드 실패: ${err.message}\n`;
        outputText += '다시 시도하거나 문제를 다시 선택해주세요.\n';
      }
    } else {
      outputText += '🎯 코드를 작성하고 "실행" 버튼을 눌러주세요!\n';
    }
    
    setOutput(outputText);
  };

  // 코드 실행 함수
  const handleRun = async () => {
    if (!runner) return;

    setRunning(true);
    setOutput('🚀 코드 실행 중...\n');

    try {
      const wrappedCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = StringIO()

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
    
    output = sys.stdout.getvalue()
finally:
    sys.stdout = old_stdout

output
`;

      const result = await runner.runCode(wrappedCode);
      
      setOutput(prev => prev + '\n📤 출력:\n' + result.output + '\n\n✅ 실행 완료!');
    } catch (err: any) {
      setOutput(prev => prev + '\n❌ 오류:\n' + err.message);
    } finally {
      setRunning(false);
    }
  };

  // 제출 함수 (채점 + Firebase 저장)
  const handleSubmit = async () => {
    if (!selectedProblem) {
      alert('문제를 먼저 선택해주세요!');
      return;
    }

    if (!runner) {
      alert('Python 환경이 준비되지 않았습니다.');
      return;
    }

    // 타이머 정지
    timer.pause();

    setRunning(true);
    setOutput('📝 제출 중...\n채점을 진행합니다...\n\n');

    try {
      // 코드 실행 및 결과 추출
      const { output, result, executionTime } = await runner.runAndExtractResult(code);
      
      // 채점
      const grading = gradingService.grade(
        result,
        selectedProblem.expectedOutput,
        selectedProblem.points,
        executionTime
      );
      
      setGradingResult(grading);
      
      // 결과 출력
      let resultText = '━━━━━━━━━━━━━━━━━━━━━━\n';
      resultText += '📋 채점 결과\n';
      resultText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
      
      if (grading.correct) {
        resultText += '🎉 ' + grading.feedback + '\n\n';
        resultText += `💯 획득 점수: ${grading.score}/${selectedProblem.points}점\n`;
      } else {
        resultText += grading.feedback + '\n\n';
        resultText += `💯 획득 점수: ${grading.score}/${selectedProblem.points}점\n`;
      }
      
      resultText += `⏱️ 실행 시간: ${grading.executionTime}ms\n`;
      resultText += `⏰ 남은 시간: ${timer.formattedTime}\n`;
      
      // 문제 푸는데 걸린 시간 계산
      const timeSpent = problemStartTime 
        ? Math.floor((Date.now() - problemStartTime) / 1000)
        : 0;
      
      resultText += `📅 소요 시간: ${Math.floor(timeSpent / 60)}분 ${timeSpent % 60}초\n\n`;
      
      // Firebase에 제출 기록 저장
      try {
        resultText += '💾 제출 기록 저장 중...\n';
        setOutput(resultText);
        
        const submission: Omit<Submission, 'id' | 'timestamp'> = {
          userId,
          problemId: selectedProblem.id!,
          code,
          result: {
            userOutput: grading.userOutput,
            expectedOutput: grading.expectedOutput,
            correct: grading.correct,
            feedback: grading.feedback
          },
          score: grading.score,
          maxScore: selectedProblem.points,
          isCorrect: grading.correct,
          executionTime: grading.executionTime,
          timeSpent
        };
        
        const submissionId = await submissionService.saveSubmission(submission);
        
        resultText += `✅ 제출 완료! (ID: ${submissionId.substring(0, 8)}...)\n\n`;
        
      } catch (saveError: any) {
        console.error('제출 저장 실패:', saveError);
        resultText += `⚠️ 제출 저장 실패: ${saveError.message}\n`;
        resultText += '(채점은 완료되었습니다)\n\n';
      }
      
      if (output) {
        resultText += '━━━━━━━━━━━━━━━━━━━━━━\n';
        resultText += '📤 실행 출력:\n';
        resultText += output + '\n';
      }
      
      setOutput(resultText);
      
      // 정답일 경우 축하 알림
      if (grading.correct) {
        setTimeout(() => {
          alert('🎉 정답입니다! 다음 문제로 도전해보세요!');
        }, 100);
      }
      
    } catch (err: any) {
      setOutput(prev => prev + '\n❌ 실행 오류:\n' + err.message);
    } finally {
      setRunning(false);
    }
  };

  // 로딩 중 화면
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">{progress}</Typography>
        <Typography variant="body2" color="text.secondary">
          최초 로딩은 시간이 걸릴 수 있습니다 (약 10-30초)
        </Typography>
      </Box>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Typography variant="h6" color="error" gutterBottom>
            ❌ 초기화 오류
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  // 메인 화면
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h4">
            🎓 빅데이터 분석기사 실기 시뮬레이터
          </Typography>
        </Box>
        
        {/* 버튼 그룹 */}
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => setPdfDialogOpen(true)}
          >
            📄 PDF 업로드
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSeedProblems}
          >
            📝 샘플 문제 등록
          </Button>
        </Box>
      </Box>

      {/* PDF 업로드 다이얼로그 */}
      <PDFUploadDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        onSuccess={handlePDFUploadSuccess}
      />

      {/* 선택된 문제 표시 */}
      {selectedProblem && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                📋 {selectedProblem.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProblem.exam}회 - 작업형 제{selectedProblem.type}유형 - 문제 {selectedProblem.number}
              </Typography>
            </Box>
            
            {/* 채점 결과 표시 */}
            {gradingResult && (
              <Box display="flex" alignItems="center" gap={2}>
                {gradingResult.correct ? (
                  <Typography variant="h6" color="success.main">
                    ✅ 정답
                  </Typography>
                ) : (
                  <Typography variant="h6" color="error.main">
                    ❌ 오답
                  </Typography>
                )}
                <Typography variant="body1">
                  {gradingResult.score}/{selectedProblem.points}점
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* 문제 통계 추가 */}
          <Box mt={2}>
            <ProblemStatsCard problemId={selectedProblem.id!} />
          </Box>
        </Paper>
      )}

      {/* 문제 목록 Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📚 문제 목록
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <ProblemList
            problems={problems}
            selectedId={selectedProblem?.id}
            onSelect={handleSelectProblem}
            loading={problemsLoading}
          />
        </Box>
      </Drawer>

      {/* 메인 컨텐츠 */}
      <Box display="flex" gap={2}>
        {/* 왼쪽: 코드 에디터 */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            코드 에디터
          </Typography>
          <CodeEditor
            code={code}
            onChange={setCode}
            onRun={handleRun}
            onSubmit={handleSubmit}
            readOnly={running}
          />
        </Paper>

        {/* 오른쪽: 타이머 + 실행 결과 */}
        <Box sx={{ width: 400 }}>
          {/* 타이머 */}
          {selectedProblem && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Timer
                secondsLeft={timer.secondsLeft}
                formattedTime={timer.formattedTime}
                isRunning={timer.isRunning}
                isExpired={timer.isExpired}
                percentage={timer.percentage}
                onStart={timer.start}
                onPause={timer.pause}
                onReset={() => timer.reset(selectedProblem.timeLimit)}
              />
            </Paper>
          )}

          {/* 실행 결과 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              실행 결과
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                minHeight: 400,
                maxHeight: 600,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap'
              }}
            >
              {output || '코드를 실행하면 결과가 여기에 표시됩니다.'}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}

export default App;