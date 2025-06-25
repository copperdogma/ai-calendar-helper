'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ExtractedEvent } from '@/types/events';

export interface ImageUploadFormProps {
  onEventsParsed?: (events: ExtractedEvent[]) => void;
  onError?: (message: string) => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ImageUploadForm({ onEventsParsed, onError }: ImageUploadFormProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      onError?.('Image exceeds 5MB limit');
      return;
    }
    setSelectedFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const uploadImage = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', selectedFile, selectedFile.name);

      const response = await fetch('/api/ai/parse-image-event', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        success: boolean;
        events: ExtractedEvent[];
      };

      if (!data.success) {
        throw new Error('AI service failed');
      }

      onEventsParsed?.(data.events);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={dragOver ? 6 : 2}
      sx={{
        p: 3,
        textAlign: 'center',
        border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
      }}
      onDragOver={e => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CloudUploadIcon color="action" sx={{ fontSize: 48 }} />
        <Typography variant="body1">Drag & drop an event flyer image here, or</Typography>
        <Button variant="outlined" onClick={() => inputRef.current?.click()}>
          Browse Files
        </Button>
        {selectedFile && (
          <Typography variant="body2" color="text.secondary">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={uploadImage}
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Processing…' : 'Extract Event'}
        </Button>
      </Box>
    </Paper>
  );
}
