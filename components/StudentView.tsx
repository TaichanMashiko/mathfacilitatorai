import React, { useState } from 'react';
import { Lesson, Reflection, User } from '../types';
import { generateReflectionFeedback } from '../services/geminiService';

interface StudentViewProps {
  user: User;
  lesson: Lesson;
  onBack: () => void;
  onSaveReflection: (lessonId: string, reflection: Reflection) => void;
}

const StudentView: React.FC<StudentViewProps> = ({ user, lesson, onBack, onSaveReflection }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'prereq' | 'advanced' | 'practice'>('main');
  const [reflectionText, setReflectionText] = useState('');
  const [rating, setRating] = useState(3);
  const [isReflecting, setIsReflecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { content } = lesson;

  const handleReflectionSubmit = async () => {
    if (!reflectionText.trim()) return;
    setIsReflecting(true);
    
    try {
      const aiResponse = await generateReflectionFeedback(lesson.title, reflectionText, rating);
      const newReflection: Reflection = {
        studentEmail: user.email,
        lessonId: lesson.id,
        date: new Date().toISOString(),
        content: reflectionText,
        aiFeedback: aiResponse,
        rating: rating
      };
      
      setFeedback(aiResponse);
      onSaveReflection(lesson.id, newReflection);
    } catch (error) {
      alert("エラーが発生しました: " + error);
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-5xl mx-auto shadow-xl rounded-lg overflow-hidden my-4">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-300 hover:text-white flex items-center gap-2">
          &larr; 一覧に戻る
        </button>
        <div className="flex flex-col items-center">
             <h1 className="text-xl font-bold">{lesson.title}</h1>
             <span className="text-xs text-slate-400">ログイン中: {user.name}</span>
        </div>
        <div className="w-20"></div> {/* Spacer */}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-100 border-r border-slate-200 overflow-y-auto p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">学習メニュー</div>
          
          <button 
            onClick={() => setActiveTab('prereq')}
            className={`p-3 text-left rounded-lg transition-colors ${activeTab === 'prereq' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <div className="font-bold text-sm">🔰 基礎・復習</div>
            <div className="text-xs opacity-75">まずはここから確認</div>
          </button>

          <button 
            onClick={() => setActiveTab('main')}
            className={`p-3 text-left rounded-lg transition-colors ${activeTab === 'main' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <div className="font-bold text-sm">📖 本日の学習</div>
            <div className="text-xs opacity-75">メインコンテンツ</div>
          </button>

          <button 
            onClick={() => setActiveTab('practice')}
            className={`p-3 text-left rounded-lg transition-colors ${activeTab === 'practice' ? 'bg-green-100 text-green-900 border border-green-300' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <div className="font-bold text-sm">✏️ 演習問題</div>
            <div className="text-xs opacity-75">理解度をチェック</div>
          </button>

          <button 
            onClick={() => setActiveTab('advanced')}
            className={`p-3 text-left rounded-lg transition-colors ${activeTab === 'advanced' ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <div className="font-bold text-sm">🚀 深掘り・探究</div>
            <div className="text-xs opacity-75">なぜ？を考える</div>
          </button>

          <div className="mt-auto pt-6 border-t border-slate-200">
             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">振り返り</div>
             <div className="text-xs text-slate-400 mb-2">学習の最後に記入しましょう</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-white">
          
          {activeTab === 'prereq' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-amber-700 mb-6 flex items-center gap-2">
                <span>🔰</span> 準備運動（前提知識）
              </h2>
              {content.prerequisites.map((req, idx) => (
                <div key={idx} className="mb-6 p-6 bg-amber-50 rounded-xl border border-amber-100">
                  <h3 className="font-bold text-lg text-amber-900 mb-2">{req.topic}</h3>
                  <p className="text-slate-700 mb-4 leading-relaxed">{req.explanation}</p>
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <span className="text-xs font-bold text-amber-600 uppercase">Check!</span>
                    <p className="font-medium text-slate-800 mt-1">{req.checkQuestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'main' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span>📖</span> {content.title}
              </h2>
              <div className="p-4 bg-blue-50 text-blue-900 rounded-lg mb-8 border-l-4 border-blue-500">
                <span className="font-bold mr-2">要約:</span>
                {content.summary}
              </div>
              <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
                 {/* Simple Markdown rendering placeholder. In production, use react-markdown */}
                 {content.mainContent.split('\n').map((line, i) => (
                   <p key={i} className="mb-4 whitespace-pre-wrap">{line}</p>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'practice' && (
             <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-green-700 mb-6 flex items-center gap-2">
                <span>✏️</span> 演習問題
              </h2>
              <div className="grid gap-6">
                {content.practice.map((prob, idx) => (
                  <PracticeCard key={idx} problem={prob} index={idx} />
                ))}
              </div>
             </div>
          )}

          {activeTab === 'advanced' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
                <span>🚀</span> {content.deepDive.title}
              </h2>
              <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="font-bold text-lg text-purple-900 mb-3">公式の背景・証明</h3>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{content.deepDive.content}</p>
              </div>
              
              <div className="p-6 bg-white border-2 border-dashed border-purple-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">💬</div>
                  <div>
                    <h3 className="font-bold text-purple-900 mb-1">ディスカッション</h3>
                    <p className="text-slate-600 mb-2">{content.deepDive.discussionPrompt}</p>
                    <p className="text-xs text-slate-400">周りの人と話し合ってみよう。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reflection Section - Always at bottom */}
          <div className="mt-16 pt-8 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">本日の振り返り</h3>
            
            {!feedback ? (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">理解度 (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button 
                        key={v}
                        onClick={() => setRating(v)}
                        className={`w-10 h-10 rounded-full font-bold transition-all ${rating === v ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">わかったこと・難しかったこと・次への課題</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例：二次関数の頂点の求め方はわかったけど、グラフの移動がイメージしにくかった。"
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleReflectionSubmit}
                  disabled={isReflecting || !reflectionText}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isReflecting ? 'AI分析中...' : '振り返りを送信してアドバイスをもらう'}
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-2 rounded-full shadow text-2xl">🤖</div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">AIファシリテーターからのアドバイス</h4>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{feedback}</p>
                    <button 
                      onClick={() => { setFeedback(null); setReflectionText(''); }}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      新しい振り返りを書く
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

// Helper component for Practice Problems
const PracticeCard: React.FC<{problem: any, index: number}> = ({problem, index}) => {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <span className="font-bold text-slate-700">Q{index + 1}</span>
      </div>
      <div className="p-6">
        <p className="text-lg font-medium text-slate-800 mb-6">{problem.question}</p>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowHint(!showHint)}
            className="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
          >
            {showHint ? 'ヒントを隠す' : '💡 ヒントを見る'}
          </button>
          
          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            {showAnswer ? '答えを隠す' : '🔑 答え合わせ'}
          </button>
        </div>

        {showHint && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-900 text-sm rounded-lg animate-fadeIn">
            <strong>ヒント:</strong> {problem.hint}
          </div>
        )}

        {showAnswer && (
          <div className="mt-4 p-3 bg-green-50 text-green-900 font-bold rounded-lg animate-fadeIn">
            答え: {problem.answer}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;
