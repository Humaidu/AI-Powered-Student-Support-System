import { Feedback, ApiResponse } from '../types';

export const feedbackApi = {
  submitFeedback: async (messageId: string, type: 'helpful' | 'unhelpful', comments?: string): Promise<ApiResponse<Feedback>> => {
    // Simulates sending AI response feedback to analytics/audit log
    await new Promise(res => setTimeout(res, 200));
    const data: Feedback = {
      id: `fb-${Date.now()}`,
      messageId,
      type,
      comments,
      createdAt: new Date().toISOString()
    };
    return { success: true, message: 'Feedback submitted. Thank you for refining our RAG accuracy!', data };
  }
};
