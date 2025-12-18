import React, { useState } from 'react';
import { Course, Unit, Lesson, LessonContent } from '../types';

interface TeacherDashboardProps {
  courses: Course[];
  onUpdateCourses: (courses: Course[]) => void;
  onSelectLesson: (lesson: Lesson) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ courses, onUpdateCourses, onSelectLesson }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Manual Lesson Creation (Since upload is removed)
  const handleCreateLesson = (unitId: string) => {
    const title = prompt("教材のタイトルを入力してください");
    if (!title) return;

    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      unitId: unitId,
      title: title,
      content: {
        title: title,
        summary: "学習内容の要約をここに入力します。",
        prerequisites: [
            { topic: "前提知識", explanation: "中学校で習った〇〇について復習します。", checkQuestion: "簡単な確認問題" }
        ],
        mainContent: "## 学習のポイント\n\nここに解説を入力します。\nMarkdown記法が使えます。",
        deepDive: {
            title: "なぜそうなるのか？",
            content: "公式の証明や背景知識をここに記述します。",
            discussionPrompt: "この考え方を使って、身近な事象を説明してみましょう。"
        },
        practice: [
            { question: "練習問題1", hint: "ヒント", answer: "解答" }
        ]
      }
    };

    const updatedCourses = courses.map(c => {
      if (c.id === selectedCourseId) {
        return {
          ...c,
          units: c.units.map(u => {
            if (u.id === unitId) {
              return { ...u, lessons: [...u.lessons, newLesson] };
            }
            return u;
          })
        };
      }
      return c;
    });

    onUpdateCourses(updatedCourses);
    setEditingLesson(newLesson); // Immediately open edit modal
  };

  const handleAddUnit = () => {
    if (!selectedCourse) return;
    const title = prompt("新しい単元名を入力してください（例：二次関数）");
    if (!title) return;

    const newUnit: Unit = {
      id: crypto.randomUUID(),
      courseId: selectedCourse.id,
      title: title,
      lessons: []
    };

    const updatedCourses = courses.map(c => 
      c.id === selectedCourse.id ? { ...c, units: [...c.units, newUnit] } : c
    );
    onUpdateCourses(updatedCourses);
  };

  const handleDeleteLesson = (unitId: string, lessonId: string) => {
    if (!confirm("本当にこの教材を削除しますか？")) return;
    const updatedCourses = courses.map(c => 
      c.id === selectedCourseId ? {
        ...c,
        units: c.units.map(u => 
          u.id === unitId ? { ...u, lessons: u.lessons.filter(l => l.id !== lessonId) } : u
        )
      } : c
    );
    onUpdateCourses(updatedCourses);
  };

  const handleSaveEdit = (editedContent: LessonContent) => {
    if (!editingLesson) return;

    const updatedCourses = courses.map(c => 
      c.id === selectedCourseId ? {
        ...c,
        units: c.units.map(u => 
          u.id === editingLesson.unitId ? {
            ...u,
            lessons: u.lessons.map(l => 
              l.id === editingLesson.id ? { ...l, title: editedContent.title, content: editedContent } : l
            )
          } : u
        )
      } : c
    );
    onUpdateCourses(updatedCourses);
    setEditingLesson(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">教材管理ダッシュボード</h1>
        <p className="text-slate-600">自律学習のための教材管理を行います。教材のPDFアップロード機能は無効化されています。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Course Selection Sidebar */}
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200 md:col-span-1 h-fit">
          <h2 className="font-bold text-lg mb-4 text-slate-700">コース一覧</h2>
          <ul className="space-y-2">
            {courses.map(course => (
              <li key={course.id}>
                <button
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full text-left px-4 py-2 rounded transition-colors ${selectedCourseId === course.id ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  {course.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          {selectedCourse ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">{selectedCourse.title} - 単元構成</h2>
                <button 
                  onClick={handleAddUnit}
                  className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 text-sm"
                >
                  + 新しい単元を作成
                </button>
              </div>

              {selectedCourse.units.map(unit => (
                <div key={unit.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-700">{unit.title}</h3>
                    <button 
                       onClick={() => handleCreateLesson(unit.id)}
                       className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded flex items-center gap-2 transition-all"
                    >
                      + 教材ページを追加
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {unit.lessons.length === 0 ? (
                      <p className="text-slate-400 text-center py-4 text-sm">教材がありません。「教材ページを追加」から作成してください。</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {unit.lessons.map(lesson => (
                          <div key={lesson.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white group relative flex flex-col">
                            <h4 className="font-bold text-slate-800 mb-2">{lesson.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{lesson.content.summary}</p>
                            
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => setEditingLesson(lesson)}
                                    className="text-slate-400 hover:text-blue-600 text-xs font-medium"
                                  >
                                    編集
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLesson(unit.id, lesson.id)}
                                    className="text-slate-400 hover:text-red-600 text-xs font-medium"
                                  >
                                    削除
                                  </button>
                               </div>
                              <button 
                                onClick={() => onSelectLesson(lesson)}
                                className="text-blue-600 text-sm font-bold hover:underline"
                              >
                                学習画面へ &rarr;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">コースを選択してください</div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <EditModal lesson={editingLesson} onClose={() => setEditingLesson(null)} onSave={handleSaveEdit} />
        </div>
      )}
    </div>
  );
};

const EditModal: React.FC<{
  lesson: Lesson;
  onClose: () => void;
  onSave: (content: LessonContent) => void;
}> = ({ lesson, onClose, onSave }) => {
  const [content, setContent] = useState<LessonContent>(lesson.content);

  const handleChange = (field: keyof LessonContent, value: any) => {
    setContent({ ...content, [field]: value });
  };

  const handleDeepDiveChange = (field: keyof LessonContent['deepDive'], value: string) => {
    setContent({ 
      ...content, 
      deepDive: { ...content.deepDive, [field]: value } 
    });
  };

  // Basic implementation of array editing could be expanded
  const handlePrereqChange = (index: number, field: string, value: string) => {
      const newPrereqs = [...content.prerequisites];
      newPrereqs[index] = { ...newPrereqs[index], [field]: value };
      setContent({ ...content, prerequisites: newPrereqs });
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h3 className="font-bold text-lg text-slate-800">教材の編集</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">タイトル</label>
          <input 
            type="text" 
            value={content.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">要約</label>
          <input 
            type="text" 
            value={content.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        {/* Prereqs Editor (Simple) */}
        <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
             <h4 className="font-bold text-amber-800 mb-2">🔰 前提知識</h4>
             {content.prerequisites.map((p, i) => (
                 <div key={i} className="mb-2 bg-white p-2 rounded border border-amber-100">
                     <input className="w-full text-sm font-bold mb-1 border-b" value={p.topic} onChange={(e) => handlePrereqChange(i, 'topic', e.target.value)} />
                     <textarea className="w-full text-xs p-1 h-16 border rounded" value={p.explanation} onChange={(e) => handlePrereqChange(i, 'explanation', e.target.value)} />
                 </div>
             ))}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 text-blue-800">📖 メインコンテンツ (Markdown対応)</label>
          <textarea 
            value={content.mainContent}
            onChange={(e) => handleChange('mainContent', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 h-48 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="border-t pt-4 border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-1 text-purple-800">🚀 深掘り・探究 (タイトル)</label>
          <input 
            type="text" 
            value={content.deepDive.title}
            onChange={(e) => handleDeepDiveChange('title', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 mb-2 outline-none"
          />
          <label className="block text-sm font-bold text-slate-700 mb-1 text-purple-800">内容</label>
          <textarea 
            value={content.deepDive.content}
            onChange={(e) => handleDeepDiveChange('content', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 h-32 font-mono text-sm outline-none"
          />
          <label className="block text-sm font-bold text-slate-700 mb-1 mt-2 text-purple-800">ディスカッションの問い</label>
           <input 
            type="text" 
            value={content.deepDive.discussionPrompt}
            onChange={(e) => handleDeepDiveChange('discussionPrompt', e.target.value)}
            className="w-full border border-slate-300 rounded p-2 outline-none"
          />
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">キャンセル</button>
        <button onClick={() => onSave(content)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
      </div>
    </div>
  );
};

export default TeacherDashboard;
