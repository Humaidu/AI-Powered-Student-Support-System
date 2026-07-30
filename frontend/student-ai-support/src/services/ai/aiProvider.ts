import { VectorChunk } from '../../types';

export interface AIResponse {
  answer: string;
  sources: {
    document: string;
    page: string | number;
    section: string;
    confidence: number;
    snippet?: string;
  }[];
  suggestedFollowups?: string[];
}

export interface AIProvider {
  generateAnswer(prompt: string, contextChunks: VectorChunk[]): Promise<AIResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}
