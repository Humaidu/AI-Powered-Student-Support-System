import React, { useState, useEffect, useRef } from "react";
import { publicChatApi } from "../../api/publicChatApi";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Array<{
    document: string;
    page: number;
    section: string;
    confidence: number;
    snippet: string;
  }>;
  suggestedFollowups?: string[];
}

const SUGGESTED_QUESTIONS = [
  "What programmes are available?",
  "How much are the fees?",
  "How do I apply?",
  "How long is Cloud Computing?",
  "Where are you located?",
  "Can I study online?",
];

// Intelligent fallback response based on question keywords
function getIntelligentFallbackResponse(question: string): string {
  const q = question.toLowerCase();

  // Greetings
  if (
    q.match(
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/,
    )
  ) {
    return "Hello! Welcome to **Hypervisor Educational Complex**. I'm here to help you with information about our programmes, admissions, tuition fees, and campus location. What would you like to know?";
  }

  // About/Institution
  if (
    q.match(
      /about|who are you|tell me about|what is hypervisor|institution|history/,
    )
  ) {
    return "**Hypervisor Educational Complex** is Ghana's premier online technology education institution located in Accra. We deliver industry-accredited **diploma and certification programmes** designed for the global digital economy.\n\nFounded by practicing engineers, we offer hands-on training in:\n• IT & Cloud Computing\n• Web Development & DevOps\n• Cyber Security\n• Digital Marketing\n\nOur programmes combine virtual labs with physical campus facilities in Airport Residential Area, Accra.";
  }

  // Programmes/Courses
  if (
    q.match(
      /programme|program|course|diploma|certification|study|learn|what do you offer|available/,
    )
  ) {
    return "We offer **6 industry-accredited programmes**:\n\n🎓 **Diploma Programmes:**\n• Diploma in Information Technology (2 years)\n• Cloud Computing Specialist (18 months)\n• DevOps Engineering (18 months)\n\n📜 **Certification Programmes:**\n• Web Development (12 months)\n• Cyber Security (12 months)\n• Digital Marketing (9 months)\n\n**All programmes include:**\n✓ Virtual lab access\n✓ Industry-recognized certifications\n✓ Hands-on projects\n✓ Career support";
  }

  // Fees/Tuition/Cost
  if (
    q.match(/fee|fees|cost|tuition|price|payment|how much|afford|expensive/)
  ) {
    return "**Tuition Fees Structure:**\n\n💰 **Diploma Programmes:** GH₵ 8,500 - GH₵ 12,000 per year\n💰 **Certification Programmes:** GH₵ 5,500 - GH₵ 7,500 total\n\n**Payment Plans Available:**\n✓ Full payment (5% discount)\n✓ Semester installments\n✓ Monthly payment plans\n\n*Fees include virtual lab access, learning materials, and certification exam fees.*\n\nFor detailed fee breakdown, click **Apply Now** or contact admissions@hypervisor.edu.gh";
  }

  // Admission/Application/Apply
  if (
    q.match(
      /admission|admissions|apply|application|enroll|enrolment|join|register|how to|process|requirements|qualify/,
    )
  ) {
    return "**Admission Process (4 Simple Steps):**\n\n**1. Online Application** - Click the **Apply Now** button and submit your details\n\n**2. Document Submission** - Upload:\n   • WASSCE/SSSCE certificate or equivalent\n   • National ID or passport\n   • Passport-size photo\n\n**3. Review & Interview** - Our team reviews your application (2-3 business days)\n\n**4. Acceptance & Enrollment** - Complete tuition payment and receive your student portal credentials\n\n**Requirements:**\n✓ Age 18+ years\n✓ SHS certificate or higher\n✓ Basic computer literacy\n\nReady to start? Click **Apply Now**!";
  }

  // Location/Campus/Address
  if (
    q.match(/location|where|address|campus|accra|ghana|visit|directions|map/)
  ) {
    return "**📍 Hypervisor Educational Complex**\n\n**Main Campus:**\nAirport Residential Area\nIndependence Avenue\nAccra, Ghana\n\n**Contact:**\n📧 admissions@hypervisor.edu.gh\n📞 +233 (0) 30 298 4500\n\n**Facilities:**\n• Modern computer labs\n• Virtual learning infrastructure\n• Study spaces & library\n• Student support services\n\n*We offer both on-campus and online learning options to suit your schedule.*";
  }

  // Online/Remote/Virtual
  if (q.match(/online|remote|virtual|distance|from home|can i study/)) {
    return "Yes! **All our programmes support online learning**:\n\n🌐 **Virtual Learning Features:**\n✓ Live online classes & recordings\n✓ 24/7 virtual lab access\n✓ Remote instructor support\n✓ Online submission & assessments\n✓ Digital learning resources\n\n**You can:**\n• Study from anywhere in Ghana or abroad\n• Balance work and education\n• Access campus facilities when needed\n\n*Ideal for working professionals and remote learners!*";
  }

  // Duration/Time/How long
  if (q.match(/duration|how long|time|period|months|years|when|start/)) {
    return "**Programme Durations:**\n\n📅 **Diploma Programmes (Full-time):**\n• Diploma in IT: 2 years\n• Cloud Computing: 18 months\n• DevOps Engineering: 18 months\n\n📅 **Certification Programmes:**\n• Web Development: 12 months\n• Cyber Security: 12 months\n• Digital Marketing: 9 months\n\n**Intakes:**\n• January, May, and September\n\n*Part-time options available with flexible schedules.*";
  }

  // Contact/Email/Phone
  if (q.match(/contact|email|phone|call|reach|speak to|talk to/)) {
    return "**Contact Hypervisor Admissions Team:**\n\n📧 **Email:** admissions@hypervisor.edu.gh\n📞 **Phone:** +233 (0) 30 298 4500\n\n**Office Hours:**\nMonday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM\n\n**Quick Actions:**\n• Click **Apply Now** to start your application\n• Use this AI assistant for instant answers\n• Visit our campus in Airport Residential Area, Accra";
  }

  // Default response
  return "Based on **Hypervisor Educational Complex** records:\n\nWe offer industry-accredited diploma and certification programmes in **Information Technology, Cloud Computing, Web Development, DevOps Engineering, Cyber Security, and Digital Marketing** in Accra, Ghana.\n\n**Popular Topics:**\n• Programme details & duration\n• Tuition fees & payment plans\n• Admission requirements\n• Campus location & facilities\n• Online learning options\n\n*What specific information are you looking for?*";
}

function getSuggestedFollowups(question: string): string[] {
  const q = question.toLowerCase();

  if (q.match(/programme|course|diploma/)) {
    return [
      "What are the tuition fees?",
      "How do I apply?",
      "Can I study online?",
    ];
  }
  if (q.match(/fee|cost|tuition/)) {
    return [
      "What payment plans are available?",
      "How do I apply?",
      "What programmes do you offer?",
    ];
  }
  if (q.match(/admission|apply|application/)) {
    return [
      "What documents do I need?",
      "How much are the fees?",
      "When can I start?",
    ];
  }
  if (q.match(/location|where|campus/)) {
    return [
      "Can I study online?",
      "How do I apply?",
      "What programmes are offered?",
    ];
  }
  if (q.match(/online|remote|virtual/)) {
    return [
      "What programmes are available?",
      "How much are the fees?",
      "How do I enroll?",
    ];
  }

  return [
    "What programmes are available?",
    "How do I apply?",
    "Where is the campus located?",
  ];
}

export const FloatingAIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "assistant",
      content:
        "Welcome to **Hypervisor Educational Complex**! I am your AI Academic Assistant. How can I assist you today with our diploma programmes, admissions, or fees?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      suggestedFollowups: [
        "What programmes are available?",
        "How do I submit an application?",
        "Where is the Accra campus located?",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Ensure session is established when widget opens
  useEffect(() => {
    const initSession = async () => {
      if (!isOpen || activeSessionId) return;

      try {
        const res = await publicChatApi.createGuestSession("Academic Inquiry");
        if (res.success && res.data) {
          setActiveSessionId(res.data.sessionId);
        }
      } catch (e) {
        console.warn(
          "Could not initialize guest chat session - will use fallback mode",
          e,
        );
      }
    };
    initSession();
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        const sessionRes =
          await publicChatApi.createGuestSession("Academic Inquiry");
        if (sessionRes.success && sessionRes.data) {
          currentSessionId = sessionRes.data.sessionId;
          setActiveSessionId(currentSessionId);
        }
      }

      if (currentSessionId) {
        const responseRes = await publicChatApi.sendGuestMessage(
          currentSessionId,
          messageText,
        );
        if (responseRes.success && responseRes.data) {
          const apiMsg = responseRes.data;
          const aiMsg: ChatMessage = {
            id: apiMsg.messageId,
            sender: "assistant",
            content: apiMsg.content,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sources: apiMsg.sources?.map((s) => ({
              document:
                s.documentTitle || s.documentId || "Institutional Document",
              page: s.pageNumber || 0,
              section: s.chunkId || "Section",
              confidence: 0.9,
              snippet: "",
            })),
            suggestedFollowups: undefined,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          throw new Error(responseRes.error?.message || "No response data");
        }
      } else {
        throw new Error("No active session");
      }
    } catch (err: any) {
      console.warn(
        "Public Chat API unavailable, using intelligent fallback:",
        err.message,
      );
      // Intelligent fallback based on question type
      const fallbackAiMsg: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        sender: "assistant",
        content: getIntelligentFallbackResponse(messageText),
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedFollowups: getSuggestedFollowups(messageText),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0b1c30] hover:bg-[#0f4c81] text-white px-5 py-3.5 rounded-full shadow-2xl border border-white/20 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">
              psychology
            </span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0b1c30] animate-pulse"></span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-none">Ask Hypervisor AI</p>
            <p className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              Online • 24/7 Assistance
            </p>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#c2c7d1] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#0b1c30] text-white px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/assets/logo.png"
                  alt="Hypervisor Logo"
                  className="w-9 h-9 rounded-lg object-contain bg-white p-1 border border-white/20"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0b1c30]"></span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm leading-snug">
                  Hypervisor AI Assistant
                </h4>
                <p className="text-[11px] text-slate-300">
                  Ask me anything about Hypervisor Educational Complex.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Minimize Chat"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          {/* Quick Suggested Question Chips */}
          <div className="p-2.5 bg-[#eff4ff] border-b border-[#c2c7d1] overflow-x-auto custom-scrollbar shrink-0">
            <p className="text-[10px] uppercase font-bold text-[#42474f] tracking-wider mb-1.5 px-1">
              Suggested Questions
            </p>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {SUGGESTED_QUESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  className="px-2.5 py-1 bg-white hover:bg-[#0f4c81] text-[#0b1c30] hover:text-white border border-[#c2c7d1] hover:border-[#0f4c81] rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-[#f8f9ff]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    msg.sender === "user"
                      ? "bg-[#0f4c81] text-white rounded-br-none"
                      : "bg-white text-[#0b1c30] border border-[#c2c7d1] rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">
                    {msg.content}
                  </div>

                  {/* Sources Accordion if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#c2c7d1]/50 text-[10px] space-y-1">
                      <p className="font-bold text-[#0f4c81] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">
                          menu_book
                        </span>
                        <span>Institutional Sources Verified:</span>
                      </p>
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-[#eff4ff] p-1.5 rounded border border-[#bbd3fd] text-slate-700"
                        >
                          <p className="font-semibold text-[#0b1c30]">
                            {src.document} (Pg. {src.page})
                          </p>
                          <p className="text-[9px] text-slate-500 italic mt-0.5">
                            "{src.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Follow up chips */}
                {msg.suggestedFollowups && msg.sender === "assistant" && (
                  <div className="mt-2 flex flex-wrap gap-1 max-w-[90%]">
                    {msg.suggestedFollowups.map((fUp, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleSend(fUp)}
                        disabled={loading}
                        className="text-[10px] px-2 py-0.5 bg-[#eff4ff] hover:bg-[#bbd3fd] text-[#00355f] font-semibold border border-[#bbd3fd] rounded-full transition-colors cursor-pointer"
                      >
                        {fUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white border border-[#c2c7d1] p-2.5 rounded-2xl rounded-bl-none max-w-[120px]">
                <div className="w-2 h-2 rounded-full bg-[#0f4c81] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#0f4c81] animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-[#0f4c81] animate-bounce [animation-delay:0.4s]"></div>
                <span className="text-[10px] font-semibold text-[#0f4c81]">
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-[#c2c7d1] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about admissions, fees, programmes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-full text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-full bg-[#0f4c81] hover:bg-[#00355f] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>
            <p className="text-[9px] text-center text-slate-400 mt-1.5">
              Powered by Hypervisor RAG AI Engine • Accra, Ghana
            </p>
          </div>
        </div>
      )}
    </>
  );
};
