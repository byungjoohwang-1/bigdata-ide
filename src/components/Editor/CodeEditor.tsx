import React from 'react';
import Editor from '@monaco-editor/react';
import { Box, Button, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';

interface Props {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<Props> = ({
  code,
  onChange,
  onRun,
  onSubmit,
  readOnly = false
}) => {
  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={onRun}
          disabled={readOnly}
        >
          실행 (Ctrl+Enter)
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={onSubmit}
          disabled={readOnly}
        >
          제출
        </Button>
      </Stack>

      <Editor
        height="500px"
        defaultLanguage="python"
        value={code}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true
        }}
      />
    </Box>
  );
};