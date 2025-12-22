'use client';
import { useState } from 'react';
import Link from 'next/link';

const SINGLE_AGENTS = [
  { id: 'baselineAgent', name: '標準添削 (無ペルソナ)', icon: '👤', desc: '標準的な丁寧な添削を行います。' },
  { id: 'supporterAgent', name: '共感型 (Supporter)', icon: '😁', desc: '褒めて伸ばす、やる気重視の添削です。' },
  { id: 'examinerAgent', name: '厳格型 (Examiner)', icon: '😐', desc: '妥協を許さない、正確性重視の指導です。' },
];

export default function Home() {
  const [selectedAgent, setSelectedAgent] = useState(SINGLE_AGENTS[0].id);

  return (
<main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">

        {/* シングルモード選択カード */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">👤 シングルモード</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">特定のエージェントと1対1で対話します。</p>

          <div className="space-y-3 mb-8 flex-1">
            {SINGLE_AGENTS.map((agent) => (
              <label 
                key={agent.id} 
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAgent === agent.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
              >
                <input 
                  type="radio" 
                  className="hidden" 
                  value={agent.id} 
                  checked={selectedAgent === agent.id} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                />
                <span className="text-2xl">{agent.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{agent.name}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight">{agent.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <Link 
            href={`/single/${selectedAgent}`} 
            className="block w-full py-4 bg-zinc-900 dark:bg-blue-600 text-white rounded-xl text-center font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
          >
            シングルチャット開始
          </Link>
        </div>

        {/* マルチモード選択カード */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">🤝 マルチモード</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">3人のAI（共感・厳格・調停）が連携して添削します。</p>
            
            {/* エージェントプレビューエリア */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex justify-around text-3xl mb-8">
              <span>😁</span><span>😐</span><span>😌</span>
            </div>
          </div>

          <Link 
            href="/multi" 
            className="block w-full py-4 bg-zinc-900 dark:bg-blue-600 text-white rounded-xl text-center font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
          >
            マルチチャット開始
          </Link>
        </div>

      </div>
    </main>
  );
}