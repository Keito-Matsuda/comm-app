'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

// 型定義
type AgentId = 'user' | 'supporter' | 'examiner' | 'mediator' ;

interface Message {
  id: string;
  agentId: AgentId;
  name: string;
  content: string;
  timestamp: Date;
}

// 設定
const AGENTS = {
  user: { 
    name: 'User',
    color: '#000000', 
    icon: '👤',
  },
  supporter: {
    name: 'Supporter',
    color: '#0dff04ff', // Red-500
    icon: '😁',
  },
  examiner: {
    name: 'Examiner',
    color: '#fc04e7ff', // Slate-600
    icon: '😐',
  },
  mediator: {
    name: 'Mediator',
    color: '#006affff', // Slate-600
    icon: '😌',
  },
};

// ChatInterfaceコンポーネント
export default function ChatInterface() {
  // ステート管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // スクロール制御用Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // テキストエリアの高さ制御用Ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージ追加時に最下部へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 入力値に応じてテキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 一旦高さをリセットして再計算させる
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 1. ユーザーのメッセージをUIに追加
    const userMsg: Message = {
      id: Date.now().toString(),
      agentId: 'user',
      name: 'あなた',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue(''); // 入力欄クリア
    setIsLoading(true);

        // 送信後、テキストエリアの高さを初期値に戻す
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // 2. APIへのリクエスト
      // route.ts で Mastra の /start-async エンドポイントを叩く
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log('API Response Debug:', data);

      // 3. レスポンスデータの抽出
      const supporterText =
        data.result?.supporterResponse ||
        data.steps?.['supporter-reply']?.output?.supporterResponse ||
        "（Supporterからの応答が取得できませんでした）";
        //console.log('supporterText:', supporterText);

      const examinerText =
        data.result?.examinerResponse || // 最終結果に入っている場合
        data.steps?.['examiner-reply']?.output?.examinerResponse || // ステップ出力に入っている場合
        "（Examinerからの応答が取得できませんでした）";

      const mediatorText =
        data.result?.mediatorResponse || // 最終結果に入っている場合
        data.steps?.['mediator-reply']?.output?.mediatorResponse || // ステップ出力に入っている場合
        "（Mediatorからの応答が取得できませんでした）";

      // 念のための確認

      // 4. エージェントの変身を表示
      // -- Supporteのターン --
      const supporterMsg: Message = {
        id: Date.now().toString() + '-s',
        agentId: 'supporter',
        name: AGENTS.supporter.name,
        content: supporterText,
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, supporterMsg]);

        // -- Examinerのターン --
        setTimeout(() => {
          const examinerMsg: Message = {
            id: Date.now().toString() + '-e',
            agentId: 'examiner',
            name: AGENTS.examiner.name,
            content: examinerText,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, examinerMsg]);

          // -- Mediatorのターン --
          setTimeout(() => {      
            const mediatorMsg: Message ={
              id: Date.now().toString() + '-m',
              agentId: 'mediator',
              name: AGENTS.mediator.name,
              content: mediatorText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, mediatorMsg]);
            setIsLoading(false); // 全員話し終わったら待機解除
          }, 1200)
        }, 1200); 
      }, 1200); 

    } catch (error) {
      console.error('Chat Error:', error);
      // エラー発生時もローディングを解除しないと操作不能になるため
      setIsLoading(false);
      alert('エラーが発生しました。コンソールを確認してください。');
    }
  };

  // キー入力ハンドラ
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 日本語変換中（Composing）はEnterで確定操作をするため、送信イベントを発火させない
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 改行の挿入を防ぐ
      handleSendMessage();
    }
  };

  // UI描画（JSX）
  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white dark:bg-zinc-900 shadow-xl border-x border-zinc-200 dark:border-zinc-800">
      
      {/* ヘッダーエリア */}
      <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 sticky top-0">
        <h1 className="font-bold text-lg text-zinc-800 dark:text-white">Chat</h1>
        <div className="flex gap-2">
          {/* キャラクターバッジ */}
          <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
            {AGENTS.supporter.icon} {AGENTS.supporter.name} 
          </span>
          <span className="text-xs font-medium bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
            {AGENTS.examiner.icon} {AGENTS.examiner.name}
          </span>
          <span className="text-xs font-medium  bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
            {AGENTS.mediator.icon} {AGENTS.mediator.name}
          </span>
        </div>
      </header>

      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.agentId === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start gap-3'}`}
            >
              {/* アイコン (AI側のみ) */}
              {!isUser && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm border border-zinc-100 dark:border-zinc-700"
                  style={{ backgroundColor: AGENTS[msg.agentId as keyof typeof AGENTS].color }}
                >
                  {AGENTS[msg.agentId as keyof typeof AGENTS].icon}
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* 名前表示 (AI側のみ) */}
                {!isUser && (
                  <span className="text-xs text-zinc-500 mb-1 ml-1 font-medium">{msg.name}</span>
                )}
                
                {/* 吹き出し */}
                <div
                  className={`px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {msg.content}
                </div>
                
                {/* 時刻表示（オプション） */}
                <span className="text-[10px] text-zinc-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {/* Loading インジケーター */}
        {isLoading && (
          <div className="flex items-center gap-3 ml-2 text-zinc-400 text-sm animate-pulse">
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            <span>Thinking...</span>
          </div>
        )}
        
        {/* 自動スクロール用アンカー */}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <footer className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex gap-2 items-end relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... "
            className="flex-1 px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[48px] max-h-[200px] leading-normal"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            aria-label="送信"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-zinc-400">
          Mastra AI Agent System
        </div>
      </footer>
    </div>
  );
}