import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  Bot,
  Send,
  User,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  Lock,
  MessageSquare
} from 'lucide-react';

export default function ChatbotPage() {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextAllowed, setContextAllowed] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations?.length > 0 && !activeConversationId) {
          loadConversation(res.data.conversations[0]._id || res.data.conversations[0].id);
        } else if (res.data.conversations?.length === 0) {
          // Welcome greeting
          setMessages([
            {
              role: 'assistant',
              content: `Hello ${user?.name || ''}! I am your MedAI Nexus Clinical Healthcare Assistant.\n\nWith your consent, I have authorized access to your uploaded lab reports, prescription reminders, and health metrics to provide tailored educational explanations.\n\nHow can I support your health and wellness journey today?`
            }
          ]);
        }
      }
    } catch (e) {}
  };

  const loadConversation = async (id) => {
    try {
      setActiveConversationId(id);
      const res = await api.get(`/chat/conversations/${id}`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
      }
    } catch (e) {
      toast.error('Failed to load conversation history.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Append optimistic user message
    const tempUserMsg = { role: 'user', content: userText };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chat/message', {
        conversationId: activeConversationId,
        message: userText,
        contextAllowed
      });

      if (res.data?.success) {
        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
          fetchConversations();
        }
        setMessages((prev) => [...prev, res.data.assistantMessage]);
      }
    } catch (err) {
      toast.error('Failed to receive AI response. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered a communication issue. Please retry your question or consult your healthcare provider.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        role: 'assistant',
        content: `Hello! Starting a new clinical discussion. Feel free to ask about your symptoms, lab test parameters, dietary planning, or medication schedules.`
      }
    ]);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      toast.success('Conversation removed.');
      if (activeConversationId === id) {
        startNewChat();
      }
      fetchConversations();
    } catch (e) {
      toast.error('Failed to delete conversation.');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">
      {/* Left Drawer: Conversation Sessions */}
      <div className="hidden lg:flex flex-col w-72 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <button
          onClick={startNewChat}
          className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-sky-200 transition"
        >
          <Plus className="w-4 h-4" /> New Discussion
        </button>

        {/* Authorized Context Toggle */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Patient Medical Context
            </span>
            <input
              type="checkbox"
              checked={contextAllowed}
              onChange={(e) => setContextAllowed(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Allow assistant to reference your medical profile, conditions, and recent lab results safely.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
            History ({conversations.length})
          </span>

          {conversations.map((c) => (
            <div
              key={c._id || c.id}
              onClick={() => loadConversation(c._id || c.id)}
              className={`p-2.5 rounded-xl text-xs cursor-pointer transition flex items-center justify-between group ${
                activeConversationId === (c._id || c.id)
                  ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{c.title || 'Discussion'}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(c._id || c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                MedAI Nexus Health Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] text-slate-400">
                {contextAllowed ? 'Authorized Clinical Context Active' : 'General Educational Mode'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={startNewChat}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? 'bg-sky-600 text-white'
                      : 'bg-gradient-to-tr from-teal-500 to-sky-600 text-white shadow-sm'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : m.isEmergencyAlert
                      ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-tl-none font-medium'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.isEmergencyAlert && (
                    <div className="flex items-center gap-1.5 font-bold text-rose-700">
                      <PhoneCall className="w-4 h-4" /> Acute Medical Alert
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.contextReferenced && !isUser && (
                    <div className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block font-semibold">
                      Referenced your authorized health profile
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-sky-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium ml-1">Formulating healthcare guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything about symptoms, medications, or lab values..."
              className="flex-1 px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl shadow-sm transition disabled:opacity-40 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            AI Assistant provides educational healthcare guidance, not medical diagnosis. In emergency, call 911.
          </p>
        </div>
      </div>
    </div>
  );
}
