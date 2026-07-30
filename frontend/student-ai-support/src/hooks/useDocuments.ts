import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api/documentApi';
import { Document, ApprovalStatus } from '../types';

export function useDocuments() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await documentApi.getDocuments();
      if (!res.success) throw new Error(res.error?.message || 'Failed to fetch documents');
      return res.data || [];
    },
    refetchInterval: 3000 // Refetch periodically to reflect document ingestion progression states
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata?: Partial<Document['metadata']> }) => {
      const res = await documentApi.uploadDocument(file, metadata);
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to upload document');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApprovalStatus }) => {
      const res = await documentApi.approveDocument(id, status);
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to update document approval status');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await documentApi.deleteDocument(id);
      if (!res.success) throw new Error(res.error?.message || 'Failed to delete document');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    approveDocument: approveMutation.mutateAsync,
    deleteDocument: deleteMutation.mutateAsync
  };
}
