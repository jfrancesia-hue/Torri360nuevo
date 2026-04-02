'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Paperclip, Upload, Trash2, Download, FileText, Image,
  File, X,
} from 'lucide-react';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

interface AttachmentsPanelProps {
  ticketId: string;
  canUpload?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  BEFORE: 'Antes',
  AFTER: 'Después',
  QUOTE_DOC: 'Presupuesto',
  DOCUMENT: 'Documento',
  EVIDENCE: 'Evidencia',
  OTHER: 'Otro',
};

const CATEGORY_CLASS: Record<string, string> = {
  BEFORE:    'bg-orange-100 text-orange-700',
  AFTER:     'bg-green-100 text-green-700',
  QUOTE_DOC: 'bg-blue-100 text-blue-700',
  DOCUMENT:  'bg-gray-100 text-gray-700',
  EVIDENCE:  'bg-purple-100 text-purple-700',
  OTHER:     'bg-muted text-muted-foreground',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function AttachmentsPanel({ ticketId, canUpload = true }: AttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('DOCUMENT');
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['attachments', ticketId],
    queryFn: () => api.get<{ data: Attachment[] }>(`/uploads/ticket/${ticketId}`),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('category', selectedCategory);
      return api.postForm(`/uploads/ticket/${ticketId}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Archivo subido');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al subir archivo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/uploads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setDeletingId(null);
      toast.success('Archivo eliminado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al eliminar'),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => uploadMutation.mutate(file));
  };

  const attachments = data?.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Adjuntos ({attachments.length})
          </CardTitle>
          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-3 w-3" />
              Subir
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {canUpload && (
          <>
            <div className="flex flex-wrap gap-1">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                    selectedCategory === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
                uploadMutation.isPending && 'opacity-60 pointer-events-none',
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
            >
              <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                {uploadMutation.isPending
                  ? 'Subiendo...'
                  : 'Arrastrá archivos acá o hacé clic para seleccionar'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Máx. 20 MB por archivo</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        )}

        {attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Sin adjuntos todavía.
          </p>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 group"
              >
                <FileIcon mimeType={att.fileType} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.fileName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[10px] px-1.5 py-0 rounded-full', CATEGORY_CLASS[att.category] || CATEGORY_CLASS.OTHER)}>
                      {CATEGORY_LABELS[att.category] || att.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={att.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Download className="h-3 w-3" />
                    </Button>
                  </a>
                  {canUpload && (
                    deletingId === att.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(att.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-600"
                        onClick={() => setDeletingId(att.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
