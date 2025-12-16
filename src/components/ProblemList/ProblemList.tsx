import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { Problem } from '../../types/problem';

interface ProblemListProps {
  problems: Problem[];
  selectedId?: string;
  onSelect: (problem: Problem) => void;
  loading?: boolean;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  problems,
  selectedId,
  onSelect,
  loading
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (problems.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          등록된 문제가 없습니다.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          "📝 샘플 문제 등록" 버튼을 눌러주세요.
        </Typography>
      </Box>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return difficulty;
    }
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {problems.map((problem) => (
        <ListItem 
          key={problem.id} 
          disablePadding
          sx={{
            borderLeft: selectedId === problem.id ? '4px solid #1976d2' : 'none',
            bgcolor: selectedId === problem.id ? 'action.selected' : 'transparent'
          }}
        >
          <ListItemButton onClick={() => onSelect(problem)}>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" fontWeight="medium">
                    [{problem.exam}회-{problem.type}-{problem.number}] {problem.title}
                  </Typography>
                </Box>
              }
              secondary={
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Chip 
                    label={getDifficultyLabel(problem.difficulty)} 
                    size="small" 
                    color={getDifficultyColor(problem.difficulty)}
                  />
                  <Chip 
                    label={`${problem.points}점`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${Math.floor(problem.timeLimit / 60)}분`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};