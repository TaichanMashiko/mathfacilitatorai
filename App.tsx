import React, { useState, useEffect } from 'react';
import { Course, Lesson, Reflection, AppView, User } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import StudentView from './components/StudentView';
import { loadInitialData, saveReflectionToSheet } from './services/sheetService';

const CLIENT_ID = '1008158953225-0049gdts0shep5vjob7ffid21pg1k5kl.apps.googleusercontent.com';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const init = async () => {
      const data = await loadInitialData();
      setCourses(data);
    };
    init();
  }, []);

  const handleGoogleLogin = () => {
    // @ts-ignore
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
      alert("Google認証ライブラリがまだ読み込まれていません。ページを更新してもう一度お試しください。");
      return;
    }

    // @ts-ignore
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets email profile openid',
      callback: async (tokenResponse: any) => {
        if (tokenResponse.access_token) {
          try {
            // Fetch user profile
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            }).then(res => res.json());

            const newUser: User = {
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              accessToken: tokenResponse.access_token,
            };
            setUser(newUser);
            setCurrentView(AppView.TEACHER_DASHBOARD); // Default to dashboard list
          } catch (e) {
            console.error("Failed to fetch user info", e);
            alert("ログインに失敗しました。");
          }
        }
      },
    });
    // @ts-ignore
    client.requestAccessToken();
  };

  const handleUpdateCourses = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
    // Note: Saving full course structure to Sheets is not implemented in this prototype
    // due to prompt complexity, but reflected in memory for the session.
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentView(AppView.STUDENT_LEARNING);
  };

  const handleBackToDashboard = () => {
    setSelectedLesson(null);
    setCurrentView(AppView.TEACHER_DASHBOARD);
  };

  const handleSaveReflection = async (lessonId: string, reflection: Reflection) => {
    if (!user) return;
    
    // Save to Google Sheets
    try {
      await saveReflectionToSheet(user.accessToken, reflection);
      alert("振り返りをGoogleスプレッドシートに保存しました！");
    } catch (e) {
      alert("スプレッドシートへの保存に失敗しました。権限を確認してください。");
    }
  };

  if (currentView === AppView.LOGIN || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100">
         <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">MathFacilitator AI</h1>
            <p className="text-slate-600 mb-8">自律学習プラットフォームへようこそ</p>
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
              Googleアカウントでログイン
            </button>
            <p className="text-xs text-slate-400 mt-4">
               ※学校のGoogleアカウント等を使用してください。<br/>
               スプレッドシートへのアクセス権限が必要です。
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xl">M</div>
          <span className="font-bold text-lg tracking-tight">MathFacilitator AI</span>
        </div>
        
        <div className="flex gap-4 items-center">
          <span className="text-xs text-slate-300 mr-2">{user.name}</span>
          <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-slate-600" />
          
          {currentView === AppView.STUDENT_LEARNING && (
             <button 
                onClick={handleBackToDashboard}
                className="ml-4 text-xs bg-slate-800 px-2 py-1 rounded"
             >
                終了
             </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {currentView === AppView.TEACHER_DASHBOARD && (
          <TeacherDashboard 
            courses={courses} 
            onUpdateCourses={handleUpdateCourses}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {currentView === AppView.STUDENT_LEARNING && selectedLesson && (
          <StudentView 
            user={user}
            lesson={selectedLesson}
            onBack={handleBackToDashboard}
            onSaveReflection={handleSaveReflection}
          />
        )}
      </div>
    </div>
  );
};

export default App;