import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';

export function useChatSessions() {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: async () => {
      const res = await chatApi.getSessions();
      if (!res.success) throw new Error(res.error?.message || 'Failed to fetch sessions');
      return res.data || [];
    }
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await chatApi.getMessages(sessionId);
      if (!res.success) throw new Error(res.error?.message || 'Failed to fetch messages');
      return res.data || [];
    },
    enabled: !!sessionId
  });
}

export function useChatActions() {
  const queryClient = useQueryClient();

  const createSessionMutation = useMutation({
    mutationFn: async ({ title, category }: { title?: string; category?: string }) => {
      const res = await chatApi.createSession(title, category);
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to create session');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const res = await chatApi.sendMessage(sessionId, content);
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to send message');
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await chatApi.deleteSession(sessionId);
      if (!res.success) throw new Error(res.error?.message || 'Failed to delete session');
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  });

  const pinSessionMutation = useMutation({
    mutationFn: async ({ sessionId, isPinned }: { sessionId: string; isPinned: boolean }) => {
      const res = await chatApi.pinSession(sessionId, isPinned);
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to pin session');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  });

  return {
    createSession: createSessionMutation.mutateAsync,
    isCreatingSession: createSessionMutation.isPending,
    sendMessage: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    deleteSession: deleteSessionMutation.mutateAsync,
    pinSession: pinSessionMutation.mutateAsync
  };
}
