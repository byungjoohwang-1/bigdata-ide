import React from 'react';
import { Box, Typography, LinearProgress, IconButton, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface TimerProps {
  secondsLeft: number;
  formattedTime: string;
  isRunning: boolean;
  isExpired: boolean;
  percentage: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function Timer({
  secondsLeft,
  formattedTime,
  isRunning,
  isExpired,
  percentage,
  onStart,
  onPause,
  onReset
}: TimerProps) {
  // 시간에 따른 색상 결정
  const getColor = (): 'success' | 'warning' | 'error' => {
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* 타이머 헤더 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight="bold">
          ⏱️ 남은 시간
        </Typography>
        
        {isExpired && (
          <Chip label="시간 초과!" color="error" size="small" />
        )}
      </Box>

      {/* 시간 표시 */}
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center"
        sx={{
          fontSize: '2rem',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: isExpired ? 'error.main' : getColor() + '.main',
          mb: 1
        }}
      >
        {formattedTime}
      </Box>

      {/* 진행바 */}
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        color={getColor()}
        sx={{ height: 8, borderRadius: 1, mb: 2 }}
      />

      {/* 컨트롤 버튼 */}
      <Box display="flex" justifyContent="center" gap={1}>
        {!isRunning ? (
          <IconButton 
            onClick={onStart} 
            color="primary" 
            size="small"
            disabled={isExpired}
          >
            <PlayArrowIcon />
          </IconButton>
        ) : (
          <IconButton onClick={onPause} color="warning" size="small">
            <PauseIcon />
          </IconButton>
        )}
        
        <IconButton onClick={onReset} color="secondary" size="small">
          <RestartAltIcon />
        </IconButton>
      </Box>
    </Box>
  );
}