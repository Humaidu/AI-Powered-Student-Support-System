import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';
import { useChatSessions, useChatMessages, useChatActions } from '../hooks/useChat';
import { feedbackApi } from '../api/feedbackApi';

export const AIAssistantPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeSessionId = searchParams.get('session');

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);
  const [openRagMap, setOpenRagMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'helpful' | 'unhelpful'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [] } = useChatSessions();
  const { data: messages = [], isLoading: loadingMessages } = useChatMessages(activeSessionId);
  const { createSession, sendMessage, isSendingMessage } = useChatActions();

  // If no session selected, select first session or create one
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setSearchParams({ session: sessions[0].id }, { replace: true });
    }
  }, [activeSessionId, sessions, setSearchParams]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingMessage]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleCreateNewChat = async () => {
    const newSess = await createSession({
      title: 'New Academic Inquiry',
      category: 'Academic'
    });
    setSearchParams({ session: newSess.id });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeSessionId) return;

    const msgText = inputMessage;
    setInputMessage('');
    setFileAttachment(null);

    await sendMessage({
      sessionId: activeSessionId,
      content: msgText
    });
  };

  const handleChipClick = (promptText: string) => {
    setInputMessage(promptText);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, type: 'helpful' | 'unhelpful') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));
    await feedbackApi.submitFeedback(messageId, type);
  };

  const toggleRagBox = (msgId: string) => {
    setOpenRagMap(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Group sessions into Today, Yesterday, Last Week
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(chatSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const todaySessions = filteredSessions.filter(s => s.updatedAt.includes('ago') || s.updatedAt.includes('Just now') || s.updatedAt.includes('Today'));
  const yesterdaySessions = filteredSessions.filter(s => s.updatedAt.toLowerCase().includes('yesterday') || s.updatedAt.includes('1 day'));
  const olderSessions = filteredSessions.filter(s => !todaySessions.includes(s) && !yesterdaySessions.includes(s));

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <TopNavBar searchPlaceholder="Search inside chat context..." />

        {/* AI Assistant Dual Panel Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation History Sidebar */}
          <aside className="w-[300px] border-r border-[#c2c7d1] bg-white flex flex-col h-full shrink-0">
            {/* New Chat Button */}
            <div className="p-4 border-b border-[#c2c7d1]">
              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 bg-[#00355f] text-white text-xs font-bold py-3 rounded-xl hover:bg-[#0f4c81] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
                New Conversation
              </button>
            </div>

            {/* Chat Search */}
            <div className="px-4 py-2 border-b border-[#c2c7d1]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#42474f] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-xs text-[#0b1c30] placeholder:text-[#42474f]/60 outline-none"
                />
              </div>
            </div>

            {/* Session Group List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
              {/* Today */}
              {todaySessions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#727780] px-2 mb-1 tracking-wider">Today</p>
                  <div className="space-y-1">
                    {todaySessions.map(sess => (
                      <div
                        key={sess.id}
                        onClick={() => setSearchParams({ session: sess.id })}
                        className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between ${
                          sess.id === activeSessionId
                            ? 'bg-[#0f4c81] text-white font-semibold shadow-xs'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] shrink-0">chat_bubble_outline</span>
                          <span className="truncate">{sess.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday */}
              {yesterdaySessions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#727780] px-2 mb-1 tracking-wider">Yesterday</p>
                  <div className="space-y-1">
                    {yesterdaySessions.map(sess => (
                      <div
                        key={sess.id}
                        onClick={() => setSearchParams({ session: sess.id })}
                        className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between ${
                          sess.id === activeSessionId
                            ? 'bg-[#0f4c81] text-white font-semibold shadow-xs'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] shrink-0">chat_bubble_outline</span>
                          <span className="truncate">{sess.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Week & Older */}
              {olderSessions.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#727780] px-2 mb-1 tracking-wider">Last Week & Older</p>
                  <div className="space-y-1">
                    {olderSessions.map(sess => (
                      <div
                        key={sess.id}
                        onClick={() => setSearchParams({ session: sess.id })}
                        className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between ${
                          sess.id === activeSessionId
                            ? 'bg-[#0f4c81] text-white font-semibold shadow-xs'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] shrink-0">chat_bubble_outline</span>
                          <span className="truncate">{sess.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Chat Workspace Canvas */}
          <main className="flex-1 flex flex-col h-full bg-[#f8f9ff] overflow-hidden">
            {/* Active Chat Header */}
            <div className="bg-white px-6 py-3 border-b border-[#c2c7d1] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#00355f] text-white rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline font-bold text-base text-[#00355f]">
                      {activeSession?.title || 'Admissions & Scholarship Query'}
                    </h2>
                    <span className="bg-[#bbd3fd] text-[#445a7f] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {activeSession?.model || 'Gemini 3.6-Flash + RAG'}
                    </span>
                    <span className="bg-[#eff4ff] border border-[#c2c7d1] text-[#0f4c81] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Institutional Knowledge
                    </span>
                  </div>
                  <p className="text-[11px] text-[#42474f]">
                    Active RAG pipeline connected to OpenSearch Open-Text Repository
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Conversation link copied to clipboard!')}
                  className="p-2 text-[#42474f] hover:bg-[#eff4ff] rounded-lg cursor-pointer transition-colors"
                  title="Share Session"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
                <button
                  onClick={() => navigate('/conversations')}
                  className="p-2 text-[#42474f] hover:bg-[#eff4ff] rounded-lg cursor-pointer transition-colors"
                  title="View All Conversations"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-[#0f4c81] gap-2">
                  <span className="w-5 h-5 border-2 border-[#0f4c81] border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-sm font-semibold">Loading RAG conversation history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                  <div className="w-16 h-16 bg-[#dce9ff] text-[#00355f] rounded-2xl flex items-center justify-center text-3xl">
                    <span className="material-symbols-outlined text-[36px]">auto_awesome</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-[#00355f]">How can I assist you today?</h3>
                  <p className="text-xs text-[#42474f]">
                    Ask any question regarding course registration, GPA criteria, hostel guidelines, or tuition fee schedules.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-3 max-w-4xl mx-auto">
                    {msg.sender === 'student' ? (
                      /* Student Message Bubble */
                      <div className="flex justify-end">
                        <div className="bg-[#0f4c81] text-white p-4 rounded-2xl rounded-tr-none max-w-2xl shadow-sm text-sm leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      /* AI Assistant Response Card */
                      <div className="flex gap-4">
                        <div className="w-9 h-9 bg-[#00355f] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                          <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="bg-white border border-[#c2c7d1] rounded-2xl p-5 shadow-xs text-sm text-[#0b1c30] space-y-4">
                            {/* Message Body with Markdown formatting */}
                            <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                              {msg.content}
                            </div>

                            {/* RAG Verification Sources Dropdown Collapsible */}
                            {msg.ragVerification && msg.ragVerification.sources.length > 0 && (
                              <div className="border border-[#c2c7d1] bg-[#eff4ff]/60 rounded-xl overflow-hidden mt-3">
                                <button
                                  onClick={() => toggleRagBox(msg.id)}
                                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#00355f] hover:bg-[#dce9ff]/50 transition-colors cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#0f4c81] text-[18px]">verified</span>
                                    <span>RAG Verification ({msg.ragVerification.sourceCount} Institutional Documents Referenced)</span>
                                  </div>
                                  <span className="material-symbols-outlined text-[18px]">
                                    {openRagMap[msg.id] !== false ? 'expand_less' : 'expand_more'}
                                  </span>
                                </button>

                                {openRagMap[msg.id] !== false && (
                                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-[#c2c7d1]/50 bg-white/80">
                                    {msg.ragVerification.sources.map((src, idx) => (
                                      <div key={idx} className="p-2.5 bg-[#f8f9ff] border border-[#c2c7d1] rounded-lg text-xs space-y-1">
                                        <div className="flex items-center justify-between font-bold text-[#0f4c81]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">description</span>
                                            <span>{src.document}</span>
                                          </div>
                                          <span className="bg-[#bbd3fd] text-[#445a7f] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                            {Math.round(src.confidence * 100)}% Match
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-[#42474f]">{src.section} | Page {src.page}</p>
                                        {src.snippet && (
                                          <p className="text-[11px] text-[#727780] italic bg-white p-1.5 rounded border border-[#c2c7d1]/40">
                                            "{src.snippet}"
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons: Copy, Regenerate, Thumbs up/down */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#c2c7d1]/60 text-xs text-[#42474f]">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopyText(msg.id, msg.content)}
                                  className="flex items-center gap-1 px-2.5 py-1 hover:bg-[#eff4ff] rounded-md transition-colors cursor-pointer"
                                  title="Copy text"
                                >
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                  <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                                </button>
                                <button
                                  onClick={() => sendMessage({ sessionId: msg.sessionId, content: 'Please expand on this answer with additional details.' })}
                                  className="flex items-center gap-1 px-2.5 py-1 hover:bg-[#eff4ff] rounded-md transition-colors cursor-pointer"
                                  title="Regenerate answer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                                  <span>Regenerate</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleFeedback(msg.id, 'helpful')}
                                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                                    feedbackGiven[msg.id] === 'helpful' ? 'bg-[#bbd3fd] text-[#0f4c81]' : 'hover:bg-[#eff4ff]'
                                  }`}
                                  title="Helpful"
                                >
                                  <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                </button>
                                <button
                                  onClick={() => handleFeedback(msg.id, 'unhelpful')}
                                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                                    feedbackGiven[msg.id] === 'unhelpful' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'hover:bg-[#eff4ff]'
                                  }`}
                                  title="Not helpful"
                                >
                                  <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Suggested Followup Prompts Chips */}
                          {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {msg.suggestedFollowups.map((chip, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleChipClick(chip)}
                                  className="px-3 py-1.5 bg-white border border-[#0f4c81]/30 hover:border-[#0f4c81] hover:bg-[#eff4ff] text-[#0f4c81] text-xs font-medium rounded-full transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-[14px]">call_made</span>
                                  <span>{chip}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Sending Indicator */}
              {isSendingMessage && (
                <div className="flex gap-4 max-w-4xl mx-auto">
                  <div className="w-9 h-9 bg-[#00355f] text-white rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div className="bg-white border border-[#c2c7d1] rounded-2xl p-4 shadow-xs flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[#00355f] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold text-[#00355f]">
                      Searching OpenSearch vector index & invoking Bedrock/Gemini...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className="bg-white border-t border-[#c2c7d1] p-4 shrink-0 shadow-lg">
              <div className="max-w-4xl mx-auto space-y-2">
                {fileAttachment && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-xs text-[#0f4c81]">
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                    <span className="font-semibold">{fileAttachment.name}</span>
                    <button onClick={() => setFileAttachment(null)} className="hover:text-[#ba1a1a] cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="relative flex items-center bg-[#eff4ff] border border-[#c2c7d1] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#0f4c81]/30 focus-within:border-[#0f4c81] transition-all">
                  <label className="p-2 text-[#42474f] hover:bg-[#dce9ff] rounded-xl cursor-pointer transition-colors" title="Attach Document">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setFileAttachment(e.target.files[0])}
                    />
                  </label>

                  <textarea
                    rows={1}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask AI Assistant about scholarships, exams, housing rules..."
                    className="flex-1 bg-transparent px-3 text-sm text-[#0b1c30] placeholder:text-[#42474f]/60 outline-none resize-none max-h-32"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSendingMessage}
                    className="p-2.5 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </form>

                <p className="text-[10px] text-center text-[#727780]">
                  AI Assistant uses RAG vector search over official institutional documents. Always verify regulatory details with the Academic Registry.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
