import React, { useState, useEffect, useRef } from 'react';
import { EXAM_DATA } from './data/exams'; // ★ 방금 만든 통합 데이터 불러오기
import { FileText, Database, Play, Save, Loader, ChevronDown } from 'lucide-react';

const ExamPage = () => {
  // 1. 상태 관리: 현재 회차(session) 추가
  const [currentSession, setCurrentSession] = useState(10);
  const [activeTab, setActiveTab] = useState("type1");
  const [activeSubProblem, setActiveSubProblem] = useState(0);
  
  // 2. 현재 선택된 데이터 가져오기
  const examData = EXAM_DATA[currentSession];
  // 데이터 보호: 혹시 없는 회차를 선택했을 때 에러 방지
  const currentProblems = examData ? examData.problems[activeTab] : [];
  const currentProblem = currentProblems[activeSubProblem] || { question: "문제 정보가 없습니다.", dataDescription: {} };

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("Python 엔진 로딩 중...");
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const pyodideRef = useRef(null);

  // 3. 회차가 바뀔 때마다 에디터 초기화
  useEffect(() => {
    if(!examData) return;
    setActiveTab("type1");
    setActiveSubProblem(0);
    setCode(getTemplateCode("type1", examData.problems.type1[0]));
    setOutput("실행 대기 중...");
  }, [currentSession]);

  // 기본 코드 템플릿 생성기
  const getTemplateCode = (type, problem) => {
    if (type === 'type2') {
      return "# [제2유형] 모델링 및 CSV 파일 생성\nimport pandas as pd\n\n# ... 데이터 전처리 ...\n\n# 결과 저장\n# df.to_csv('result.csv', index=False)";
    }
    const url = problem?.dataUrl || "";
    return `import pandas as pd\nfrom pyodide.http import open_url\n\n# 데이터 불러오기\nurl = '${url}'\ndf = pd.read_csv(open_url(url))\nprint(df.head())`;
  };

  // 탭 변경 핸들러
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveSubProblem(0);
    const firstProblem = examData.problems[tabId][0];
    setCode(getTemplateCode(tabId, firstProblem));
    setOutput("실행 대기 중...");
  };

  // 파이썬 로딩 (기존과 동일)
  useEffect(() => {
    const loadPython = async () => {
      try {
        setOutput("⏳ Python 엔진 시동 중...");
        if (!window.loadPyodide) throw new Error("Pyodide 스크립트 없음");
        const pyodide = await window.loadPyodide();
        await pyodide.loadPackage(['pandas', 'numpy', 'scikit-learn', 'micropip']); // 사이킷런도 추가
        const micropip = pyodide.pyimport("micropip");
        await micropip.install('pyodide-http');
        await pyodide.runPythonAsync(`import pyodide_http; pyodide_http.patch_all()`);
        
        pyodideRef.current = pyodide;
        setIsPyodideReady(true);
        setOutput("✅ 준비 완료!");
      } catch (err) { setOutput(`❌ 로딩 실패: ${err.message}`); }
    };
    loadPython();
  }, []);

  // 실행 함수
  const runCode = async () => {
    if (!isPyodideReady) return;
    setOutput("⏳ 실행 중...");
    try {
      await pyodideRef.current.runPythonAsync(`import sys; from io import StringIO; sys.stdout = StringIO(); sys.stderr = sys.stdout`);
      await pyodideRef.current.runPythonAsync(code);
      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      setOutput(stdout || "실행 완료 (출력 없음)");
    } catch (err) {
      setOutput(`❌ 에러:\n${err.message}`);
    }
  };

  // 채점 함수
  const submitCode = async () => {
    if (!isPyodideReady) return;
    setOutput("📝 채점 중...");
    try {
      // 실행
      await pyodideRef.current.runPythonAsync(`import sys; from io import StringIO; sys.stdout = StringIO()`);
      await pyodideRef.current.runPythonAsync(code);
      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      setOutput(stdout);

      if (activeTab === "type2") {
        const hasFile = pyodideRef.current.runPython(`import os; os.path.exists('result.csv')`);
        if (hasFile) alert("🎉 제출 성공! (파일 생성됨)");
        else alert("❌ 실패: result.csv 파일이 없습니다.");
      } else {
        if (!currentProblem.answer) { alert("정답 데이터가 없습니다."); return; }
        const userRes = stdout.trim();
        const ans = currentProblem.answer.toString().trim();
        if (userRes.includes(ans)) alert(`🎉 정답! (+${currentProblem.score}점)`);
        else alert(`❌ 오답입니다.\n내 답: ${userRes}\n정답: ${ans}`);
      }
    } catch (err) { setOutput(`❌ 채점 중 에러: ${err.message}`); }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 왼쪽: 문제 영역 */}
      <div className="w-2/5 bg-white border-r shadow-lg flex flex-col">
        {/* 헤더에 회차 선택 기능 추가 */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-blue-300" />
            <h1 className="font-bold text-lg">빅데이터 실기 체험</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* ★ 드롭다운 메뉴 */}
            <div className="relative">
              <select 
                value={currentSession}
                onChange={(e) => setCurrentSession(Number(e.target.value))}
                className="appearance-none bg-slate-700 hover:bg-slate-600 text-white pl-3 pr-8 py-1 rounded cursor-pointer border border-slate-600 outline-none font-bold text-sm transition-colors"
              >
                {[10, 9, 8, 7, 6, 5].map(num => (
                  <option key={num} value={num}>제{num}회 기출</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2 pointer-events-none text-slate-300"/>
            </div>
            
            <div className="flex items-center gap-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${isPyodideReady ? 'bg-green-400 shadow-[0_0_5px_lime]' : 'bg-red-500 animate-pulse'}`}></span>
              <span className="text-slate-300">{isPyodideReady ? 'Ready' : 'Loading'}</span>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b bg-gray-50">
          {examData?.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-sm font-bold transition-all ${
                activeTab === tab.id ? "border-b-4 border-blue-600 text-blue-700 bg-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 문제 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentProblems.length > 1 && (
            <div className="flex gap-2 mb-4">
              {currentProblems.map((prob, idx) => (
                <button
                  key={prob.id}
                  onClick={() => setActiveSubProblem(idx)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                    activeSubProblem === idx ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300"
                  }`}
                >
                  문제 {idx + 1}
                </button>
              ))}
            </div>
          )}

          <div className="prose">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-800">
              <FileText className="w-5 h-5 text-blue-600" />
              문제 {activeSubProblem + 1}
            </h2>
            <p className="whitespace-pre-line text-gray-700 mb-6 bg-gray-50 p-4 rounded border">
              {currentProblem.question}
            </p>

            {currentProblem.dataUrl && (
              <>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-gray-600">
                  <Database className="w-4 h-4 text-green-600" />
                  데이터 명세
                </h3>
                <div className="text-xs bg-gray-100 p-2 rounded mb-2 text-blue-600 font-mono break-all">
                  {currentProblem.dataUrl}
                </div>
                <table className="w-full text-sm border-collapse border">
                  <thead className="bg-gray-100">
                    <tr><th className="border p-2 w-1/3">컬럼명</th><th className="border p-2">설명</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(currentProblem.dataDescription || {}).map(([key, value]) => (
                      <tr key={key}><td className="border p-2 font-mono text-red-600 font-bold">{key}</td><td className="border p-2">{value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 에디터 */}
      <div className="w-3/5 flex flex-col h-full">
        <div className="h-14 bg-gray-200 border-b flex items-center px-4 justify-between shrink-0">
          <div className="font-bold text-gray-600 text-sm">Python 3.x Environment</div>
          <div className="flex gap-2">
            <button onClick={runCode} disabled={!isPyodideReady} className={`flex items-center gap-1 px-4 py-2 text-white text-sm font-bold rounded ${isPyodideReady ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}>
              <Play size={16} /> 실행
            </button>
            <button onClick={submitCode} disabled={!isPyodideReady} className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">
              <Save size={16} /> 제출
            </button>
          </div>
        </div>
        <textarea className="flex-1 p-6 font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4] resize-none outline-none" value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false" />
        <div className="h-48 bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto border-t border-gray-700 whitespace-pre-wrap">{output}</div>
      </div>
    </div>
  );
};

export default ExamPage;