import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface Props {
  problem: any;
}

export const ProblemDetail: React.FC<Props> = ({ problem }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {problem.title}
      </Typography>
      <Typography variant="body1">
        {problem.description}
      </Typography>
    </Paper>
  );
};