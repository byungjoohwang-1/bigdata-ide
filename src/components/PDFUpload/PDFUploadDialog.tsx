import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Paper,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import { pdfService, PDFAnalysisResult } from '../../services/firebase/pdfService';

interface PDFUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PDFUploadDialog: React.FC<PDFUploadDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<PDFAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setAnalysis(null);
    } else {
      setError('PDF 파일만 업로드 가능합니다.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setAnalysis(null);
    } else {
      setError('PDF 파일만 업로드 가능합니다.');
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await pdfService.analyzePDF(selectedFile);
      clearInterval(progressInterval);
      setProgress(100);
      setAnalysis(result);
    } catch (err: any) {
      setError('PDF 분석 실패: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUploadAndRegister = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      const result = await pdfService.uploadAndRegisterProblems(selectedFile);
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        alert(`✅ ${result.count}개의 문제가 등록되었습니다!`);
        onSuccess();
        handleClose();
      }, 500);
    } catch (err: any) {
      setError('문제 등록 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading && !analyzing) {
      setSelectedFile(null);
      setAnalysis(null);
      setError(null);
      setProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>📄 PDF 기출문제 업로드</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {!selectedFile && (
          <Paper
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'primary.main',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => document.getElementById('pdf-input')?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6">PDF 파일을 드래그하거나 클릭하여 업로드</Typography>
            <Typography variant="body2" color="text.secondary">
              빅데이터분석기사 기출문제 PDF
            </Typography>
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Paper>
        )}

        {selectedFile && !analysis && (
          <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? '분석 중...' : '📊 PDF 분석하기'}
            </Button>

            {analyzing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  분석 중... {progress}%
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {analysis && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>✅ PDF 분석 완료!</Alert>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction="row" spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {analysis.totalPages}
                  </Typography>
                  <Typography variant="body2">총 페이지</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {analysis.suggestedProblems.length}
                  </Typography>
                  <Typography variant="body2">추출된 문제</Typography>
                </Box>
              </Stack>
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
              추출된 문제 목록:
            </Typography>
            <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
              <List dense>
                {analysis.suggestedProblems.map((problem, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`${index + 1}. ${problem.title}`}
                        secondary={`${problem.type}유형 • ${problem.points}점`}
                      />
                    </ListItem>
                    {index < analysis.suggestedProblems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              문제 등록 중... {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading || analyzing}>
          취소
        </Button>
        {analysis && (
          <Button
            variant="contained"
            onClick={handleUploadAndRegister}
            disabled={uploading}
            startIcon={<CheckCircleIcon />}
          >
            {uploading ? '등록 중...' : '문제 등록하기'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};