export interface RAGSource {
  document: string;
  page: number;
  section: string;
  confidence: number;
  snippet: string;
}

export interface RAGResult {
  answer: string;
  sources: RAGSource[];
  suggestedFollowups: string[];
}

export function synthesizeRAGAnswer(prompt: string, contextChunks: any[]): RAGResult {
  if (!contextChunks || contextChunks.length === 0) {
    return {
      answer: "I could not find this information in the available institutional documents. Please contact the appropriate department.",
      sources: [],
      suggestedFollowups: [
        "Where can I find official campus contacts?",
        "How do I submit an administrative support ticket?",
        "View Student Handbook"
      ]
    };
  }

  const primaryChunk = contextChunks[0];
  const docTitle = primaryChunk.documentTitle || 'Institutional Handbook';
  const secName = primaryChunk.section || primaryChunk.metadata?.section || 'General Regulations';
  const content = primaryChunk.content || '';
  const lowerPrompt = prompt.toLowerCase();

  // Extract sources
  const sources: RAGSource[] = contextChunks.slice(0, 3).map((chunk: any, idx: number) => {
    const rawTitle = chunk.documentTitle || 'Academic_Handbook.pdf';
    const formattedTitle = rawTitle.endsWith('.pdf') ? rawTitle : `${rawTitle.replace(/\s+/g, '_')}.pdf`;
    return {
      document: formattedTitle,
      page: chunk.pageNumber || chunk.metadata?.pageNumber || 1,
      section: chunk.section || chunk.metadata?.section || 'Institutional Regulations',
      confidence: Math.round((0.98 - idx * 0.05) * 100) / 100,
      snippet: (chunk.content || '').slice(0, 120) + '...'
    };
  });

  // Direct answer handling for institution identity queries
  if (lowerPrompt.includes('name') && (lowerPrompt.includes('institution') || lowerPrompt.includes('school') || lowerPrompt.includes('university') || lowerPrompt.includes('college') || lowerPrompt.includes('complex'))) {
    return {
      answer: `The official name of the institution is **Hypervisor Educational Complex**.\n\nAccording to official campus records (*${docTitle}*, ${secName}):\n\n- **Institution Name**: Hypervisor Educational Complex\n- **Primary Campus Portal**: Hypervisor Student Portal\n- **Official Support**: Academic Registry & IT Helpdesk`,
      sources,
      suggestedFollowups: [
        'What programs and courses are offered?',
        'What are the admissions and scholarship criteria?',
        'Where can I find campus contact information?'
      ]
    };
  }

  // General structured answer formatting
  let formattedAnswer = `Based on official **Hypervisor Educational Complex** institutional documents (*${docTitle}*, ${secName}):\n\n`;

  if (content) {
    formattedAnswer += `${content}\n\n`;
  }

  formattedAnswer += `*For official exceptions, record verification, or policy appeals, please consult the Academic Registry.*`;

  // Tailor follow-ups based on prompt topic
  let suggestedFollowups = [
    'How do I apply for an official exception?',
    'What are the key policy deadlines?',
    'Where can I download the full document?'
  ];

  if (lowerPrompt.includes('wifi') || lowerPrompt.includes('internet') || lowerPrompt.includes('helpdesk')) {
    suggestedFollowups = [
      'What is the IT helpdesk phone number?',
      'How do I set up Multi-Factor Authentication (MFA)?',
      'Where is the Technology Center located?'
    ];
  } else if (lowerPrompt.includes('library') || lowerPrompt.includes('book') || lowerPrompt.includes('fine') || lowerPrompt.includes('borrow')) {
    suggestedFollowups = [
      'What happens if I lose a library book?',
      'Can I renew standard 14-day book loans online?',
      'Where is the course reserve reference section?'
    ];
  } else if (lowerPrompt.includes('scholarship') || lowerPrompt.includes('gpa') || lowerPrompt.includes('merit') || lowerPrompt.includes('grant')) {
    suggestedFollowups = [
      'What are the SAT and ACT score requirements?',
      'When is the scholarship application deadline?',
      'How do I maintain my merit grant eligibility?'
    ];
  } else if (lowerPrompt.includes('exam') || lowerPrompt.includes('course') || lowerPrompt.includes('add') || lowerPrompt.includes('drop')) {
    suggestedFollowups = [
      'What is the exact deadline for Add/Drop week?',
      'When do final semester exams end?',
      'How do I register for summer courses?'
    ];
  } else if (lowerPrompt.includes('hostel') || lowerPrompt.includes('dorm') || lowerPrompt.includes('key') || lowerPrompt.includes('room')) {
    suggestedFollowups = [
      'How much is the replacement fee for lost keycards?',
      'Where is the Housing Maintenance Office?',
      'How do I log a maintenance ticket?'
    ];
  } else if (lowerPrompt.includes('tuition') || lowerPrompt.includes('bursar') || lowerPrompt.includes('fee') || lowerPrompt.includes('payment')) {
    suggestedFollowups = [
      'How do I set up an instalment payment plan?',
      'When do financial aid disbursements post to student accounts?',
      'What payment methods are accepted by the Bursar?'
    ];
  } else if (lowerPrompt.includes('visa') || lowerPrompt.includes('i-20') || lowerPrompt.includes('international')) {
    suggestedFollowups = [
      'How do I renew my Form I-20 travel signature?',
      'What is the minimum credit load for F-1 visa status?',
      'Where is the International Student Office located?'
    ];
  }

  return {
    answer: formattedAnswer,
    sources,
    suggestedFollowups
  };
}
