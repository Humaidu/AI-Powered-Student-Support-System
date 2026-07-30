import { AIProvider, AIResponse } from './aiProvider';
import { VectorChunk } from '../../types';
import { synthesizeRAGAnswer } from '../../utils/ragSynthesizer';

export class GeminiProvider implements AIProvider {
  async generateAnswer(prompt: string, contextChunks: VectorChunk[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          contextChunks: contextChunks.map(c => ({
            documentTitle: c.documentTitle,
            pageNumber: c.metadata.pageNumber,
            section: c.metadata.section,
            content: c.content
          }))
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Backend server call to Gemini proxy endpoint failed, using client RAG synthesizer', e);
    }

    // Client fallback RAG generation if backend endpoint unavailable
    return synthesizeRAGAnswer(prompt, contextChunks);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Generate deterministic 10-dim embedding representation for local vector search
    const vector = new Array(10).fill(0);
    const lower = text.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      vector[i % 10] += lower.charCodeAt(i) * 0.001;
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(val => Math.round((val / norm) * 1000) / 1000);
  }
}
