import { VectorSearchProvider } from './vectorSearchProvider';
import { VectorChunk, VectorSearchResult } from '../../types';
import initialEmbeddings from '../../mock/embeddings.json';

// Keyword dictionary mappings for domain-specific query boosting
const DOMAIN_TOPICS: Record<string, string[]> = {
  'chk-001': ['scholarship', 'sat', 'act', 'gpa', 'merit', 'admissions', 'apply', 'entry', 'requirement', 'qualify'],
  'chk-002': ['institution', 'name', 'university', 'college', 'school', 'complex', 'hypervisor', 'overview', 'about', 'financial', 'grant', 'aid', 'funding', 'tuition'],
  'chk-003': ['exam', 'registration', 'add', 'drop', 'calendar', 'timetable', 'mid-term', 'final', 'schedule', 'date', 'deadline'],
  'chk-004': ['hostel', 'dorm', 'dormitory', 'housing', 'residence', 'key', 'card', 'keycard', 'lock', 'room', 'lost'],
  'chk-005': ['tuition', 'bursar', 'fee', 'payment', 'installment', 'wire', 'card', 'disbursement', 'bill'],
  'chk-006': ['library', 'book', 'borrow', 'fine', 'late', 'loan', 'overdue', 'textbook', 'reserve'],
  'chk-007': ['wifi', 'wi-fi', 'internet', 'network', 'password', 'it', 'helpdesk', 'support', 'login', 'mfa', 'credentials'],
  'chk-008': ['grade', 'grading', 'probation', 'failing', 'repeat', 'standing', 'fail', 'gpa'],
  'chk-009': ['graduation', 'degree', 'credit', 'credits', 'capstone', 'audit', 'requirements', 'major'],
  'chk-010': ['visa', 'i-20', 'international', 'immigration', 'travel', 'passport', 'f-1', 'status']
};

function calculateQueryMatchScore(query: string, chunk: VectorChunk): number {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/[^a-z0-9]+/).filter(w => w.length > 2);
  if (words.length === 0) return 0;

  // Special boost for institutional identity questions
  if ((queryLower.includes('institution') || queryLower.includes('university') || queryLower.includes('name')) && chunk.chunkId === 'chk-002') {
    return 0.95;
  }

  // 1. Direct content keyword count
  const contentLower = (chunk.content + " " + chunk.documentTitle + " " + (chunk.metadata.section || '')).toLowerCase();
  let contentMatches = 0;
  for (const word of words) {
    if (contentLower.includes(word)) {
      contentMatches++;
    }
  }

  const contentScore = contentMatches / words.length;

  // 2. Domain topic boost
  const topicKeywords = DOMAIN_TOPICS[chunk.chunkId] || [];
  let topicMatches = 0;
  for (const word of words) {
    if (topicKeywords.some(tk => tk.includes(word) || word.includes(tk))) {
      topicMatches++;
    }
  }

  const topicScore = words.length > 0 ? topicMatches / words.length : 0;

  return (contentScore * 0.4) + (topicScore * 0.6);
}

export class LocalVectorProvider implements VectorSearchProvider {
  private chunks: VectorChunk[] = initialEmbeddings as VectorChunk[];

  async search(query: string, topK: number = 5): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const chunk of this.chunks) {
      const matchScore = calculateQueryMatchScore(query, chunk);

      if (matchScore > 0.15) {
        results.push({
          chunk,
          similarity: Math.min(0.99, Math.max(0.55, 0.50 + matchScore * 0.50))
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, topK);
  }

  async addChunk(chunk: VectorChunk): Promise<void> {
    this.chunks.push(chunk);
  }
}
