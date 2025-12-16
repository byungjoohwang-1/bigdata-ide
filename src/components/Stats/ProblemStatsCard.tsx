import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { submissionService } from '../../services/firebase/submissionService';
import { ProblemStats } from '../../types/submission';

interface ProblemStatsCardProps {
  problemId: string;
}

export function ProblemStatsCard({ problemId }: ProblemStatsCardProps) {
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await submissionService.getProblemStats(problemId);
      setStats(data);
      setLoading(false);
    };

    loadStats();
  }, [problemId]);

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <CircularProgress size={20} />
      </Paper>
    );
  }

  if (!stats) {
    return (
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary">
          📊 아직 제출 기록이 없습니다
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, bgcolor: '#f0f7ff' }}>
      <Typography variant="subtitle2" gutterBottom>
        📊 문제 통계
      </Typography>
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Typography variant="body2">
          총 시도: {stats.totalAttempts}회
        </Typography>
        <Typography variant="body2">
          정답률: {stats.successRate.toFixed(1)}%
        </Typography>
        <Typography variant="body2">
          평균 점수: {stats.averageScore.toFixed(1)}점
        </Typography>
      </Box>
    </Paper>
  );
}