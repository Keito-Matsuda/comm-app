'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// 型定義
type AgentId = 'user' | 'supporter' | 'examiner' | 'mediator' ;

interface Message {
  id: string;
  agentId: AgentId;
  name: string;
  content: string;
  timestamp: Date;
}

// 設定 (配色とアイコンを最新の状態に維持)
const AGENTS = {
  user: { 
    name: 'User',
    color: '#000000', 
    icon: '👤',
  },
  supporter: {
    name: 'Supporter',
    color: '#0dff04ff', 
    icon: '😁',
  },
  examiner: {
    name: 'Examiner',
    color: '#fc04e7ff', 
    icon: '😐',
  },
  mediator: {
    name: 'Mediator',
    color: '#006affff', 
    icon: '😌',
  },
};

export default function MultiInterface() {
  // ステート管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // スクロール・テキストエリア制御用Ref
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

  // メッセージ送信処理
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
        body: JSON.stringify({ message: userMsg.content }), // 既存のマルチ用エンドポイント
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);

      const data = await res.json();

      const supporterText = data.result?.supporterResponse || data.steps?.['supporter-reply']?.output?.supporterResponse || "（取得失敗）";
      const examinerText = data.result?.examinerResponse || data.steps?.['examiner-reply']?.output?.examinerResponse || "（取得失敗）";
      const mediatorText = data.result?.mediatorResponse || data.steps?.['mediator-reply']?.output?.mediatorResponse || "（取得失敗）";

      // エージェントの返信を順次表示
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + '-s',
          agentId: 'supporter',
          name: AGENTS.supporter.name,
          content: supporterText,
          timestamp: new Date(),
        }]);

        setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: Date.now().toString() + '-e',
            agentId: 'examiner',
            name: AGENTS.examiner.name,
            content: examinerText,
            timestamp: new Date(),
          }]);

          setTimeout(() => {      
            setMessages((prev) => [...prev, {
              id: Date.now().toString() + '-m',
              agentId: 'mediator',
              name: AGENTS.mediator.name,
              content: mediatorText,
              timestamp: new Date(),
            }]);
            setIsLoading(false);
          }, 1200)
        }, 1200); 
      }, 1200); 

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
    // 【シングルと統一】 w-full 指定と背景色の設定
    <div className="flex flex-col h-screen w-full bg-zinc-50 dark:bg-black">
      
      {/* 【シングルと統一】 ヘッダーエリアに「戻るボタン」を追加 */}
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 sticky top-0">
        <Link href="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-zinc-800 dark:text-white leading-none">Chat</h1>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Multi-Agent Mode</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/50">
              {AGENTS.supporter.icon}
            </span>
            <span className="text-[10px] font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-800/50">
              {AGENTS.examiner.icon}
            </span>
            <span className="text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/50">
              {AGENTS.mediator.icon}
            </span>
          </div>
        </div>
      </header>

      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.agentId === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start gap-3'}`}>
              {!isUser && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-700"
                  style={{ backgroundColor: AGENTS[msg.agentId as keyof typeof AGENTS].color }}
                >
                  {AGENTS[msg.agentId as keyof typeof AGENTS].icon}
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
                    // ユーザーメッセージ
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    // AIメッセージ (Markdown対応 & ラッパーdivによる型エラー回避)
                    <div className="prose prose-sm dark:prose-invert max-w-none 
                                    prose-p:leading-relaxed prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900
                                    prose-ul:list-disc prose-ol:list-decimal">
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
            className="flex-1 px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[48px] max-h-[200px] leading-normal"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 transition-all shadow-sm"
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