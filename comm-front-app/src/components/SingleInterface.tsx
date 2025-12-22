'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// 型定義
type AgentId = 'user' | 'supporter' | 'examiner' | 'baseline' ;

interface Message {
  id: string;
  agentId: string; // 表示設定を引くためのID
  name: string;
  content: string;
  timestamp: Date;
}

// 設定 (MultiInterfaceの設定を移植)
const AGENTS = {
  user: { 
    name: 'User',
    color: '#000000', 
    icon: '👤',
  },
  baselineAgent: {
    name: 'Standard AI',
    icon: '👤',
    color: '#71717a',
  },
  supporterAgent: {
    name: 'Supporter',
    color: '#0dff04ff', 
    icon: '😁',
  },
  examinerAgent: {
    name: 'Examiner',
    color: '#fc04e7ff', 
    icon: '😐',
  },
};

export default function SingleInterface({ agentId }: { agentId: string }) {
  // ステート管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 表示用設定の取得
  const currentAgent = AGENTS[agentId as keyof typeof AGENTS] || AGENTS.baselineAgent;

  // スクロール制御用Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      name: 'あなた',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          mode: 'single',
          agentId: agentId
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data = await res.json();
      
      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        agentId: agentId,
        name: currentAgent.name,
        content: data.text || data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);

    } catch (error) {
      console.error('Chat Error:', error);
      setIsLoading(false);
      alert('エラーが発生しました。');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    // 背景色を zinc-50 / black に指定してダークモードに対応
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-black">
      
      {/* ヘッダーエリア */}
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 sticky top-0">
        <Link href="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        </Link>
        <div>
          <h1 className="font-bold text-lg text-zinc-800 dark:text-white leading-none">{currentAgent.name}</h1>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Single Mode</span>
        </div>
      </header>

      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.agentId === 'user';
          // マルチと同じアイコン・配色ロジック
          const config = isUser ? AGENTS.user : (AGENTS[msg.agentId as keyof typeof AGENTS] || AGENTS.baselineAgent);
          
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start gap-3'}`}>
              {!isUser && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-700"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                {!isUser && (
                  <span className="text-xs text-zinc-500 mb-1 ml-1 font-medium dark:text-zinc-400">{msg.name}</span>
                )}
                
                {/* 吹き出し */}
                <div
                  className={`px-4 py-3 rounded-2xl leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {isUser ? (
                    // ユーザーのメッセージはそのまま（改行維持）
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    // AIのメッセージはMarkdownとして解析して表示
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none 
                                prose-p:leading-relaxed prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900
                                prose-ul:list-disc prose-ol:list-decimal"
                    >
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                <span className="text-[10px] text-zinc-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-3 ml-2 text-zinc-400 text-sm animate-pulse">
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <footer className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto flex gap-2 items-end relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... "
            className="flex-1 px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[48px] max-h-[200px] leading-normal"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 transition-all shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-zinc-400">
          Keity System
        </div>
      </footer>
    </div>
  );
}