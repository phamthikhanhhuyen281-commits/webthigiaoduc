
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, User, Exam, Question, ChatMessage, Lesson, ContactMessage } from './types';
import { SAMPLE_EXAMS, LESSONS as INITIAL_LESSONS } from './constants';
import { sendOTPEmail } from './services/emailService';
import { chatWithAI, createExamFromFile } from './services/geminiService';

const ADMIN_SECRET_CODE = "EDUVIP202425thtenyWbxny34";

// --- MODERN SNAKE GAME COMPONENT ---
const SnakeGame: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const directionRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('snake_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleDirection = (dir: string) => {
    if (dir === "LEFT" && directionRef.current !== "RIGHT") directionRef.current = "LEFT";
    else if (dir === "UP" && directionRef.current !== "DOWN") directionRef.current = "UP";
    else if (dir === "RIGHT" && directionRef.current !== "LEFT") directionRef.current = "RIGHT";
    else if (dir === "DOWN" && directionRef.current !== "UP") directionRef.current = "DOWN";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const box = 20;
    let snake: {x: number, y: number}[] = [{x: 10 * box, y: 10 * box}];
    let food = {
      x: Math.floor(Math.random() * 19 + 1) * box,
      y: Math.floor(Math.random() * 19 + 1) * box
    };

    const keyDirection = (event: KeyboardEvent) => {
      if(event.keyCode === 37) handleDirection("LEFT");
      else if(event.keyCode === 38) handleDirection("UP");
      else if(event.keyCode === 39) handleDirection("RIGHT");
      else if(event.keyCode === 40) handleDirection("DOWN");
    };

    document.addEventListener("keydown", keyDirection);

    const draw = () => {
      ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
      ctx.fillRect(0, 0, 400, 400);

      for(let i = 0; i < snake.length; i++) {
        const gradient = ctx.createLinearGradient(snake[i].x, snake[i].y, snake[i].x + box, snake[i].y + box);
        gradient.addColorStop(0, i === 0 ? "#6366f1" : "#a855f7");
        gradient.addColorStop(1, i === 0 ? "#4f46e5" : "#7c3aed");
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = i === 0 ? 10 : 0;
        ctx.shadowColor = "#6366f1";
        
        ctx.beginPath();
        ctx.roundRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ef4444";
      ctx.beginPath();
      ctx.arc(food.x + box/2, food.y + box/2, box/2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      let snakeX = snake[0].x;
      let snakeY = snake[0].y;

      if( directionRef.current === "LEFT") snakeX -= box;
      if( directionRef.current === "UP") snakeY -= box;
      if( directionRef.current === "RIGHT") snakeX += box;
      if( directionRef.current === "DOWN") snakeY += box;

      if(snakeX === food.x && snakeY === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if(newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snake_highscore', newScore.toString());
          }
          return newScore;
        });
        food = {
          x: Math.floor(Math.random() * 19 + 1) * box,
          y: Math.floor(Math.random() * 19 + 1) * box
        };
      } else {
        snake.pop();
      }

      let newHead = { x: snakeX, y: snakeY };

      if(snakeX < 0 || snakeX >= 400 || snakeY < 0 || snakeY >= 400 || collision(newHead, snake)) {
        setGameOver(true);
        clearInterval(game);
      }

      snake.unshift(newHead);
    };

    const collision = (head: {x: number, y: number}, array: {x: number, y: number}[]) => {
      for(let i = 0; i < array.length; i++) {
        if(head.x === array[i].x && head.y === array[i].y) return true;
      }
      return false;
    };

    let game = setInterval(draw, 100);
    return () => {
      clearInterval(game);
      document.removeEventListener("keydown", keyDirection);
    };
  }, [gameOver, isDark]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between w-full mb-6 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Điểm hiện tại</span>
          <span className="text-2xl font-black text-indigo-500">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kỷ lục</span>
          <span className="text-2xl font-black text-amber-500">{highScore}</span>
        </div>
      </div>
      
      <div className={`relative w-full aspect-square p-2 rounded-[2rem] shadow-2xl border-4 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-white bg-white'}`}>
        <canvas ref={canvasRef} width={400} height={400} className="w-full h-full rounded-[1.5rem]" />
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center rounded-[1.5rem] animate-in fade-in duration-300">
            <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase">Thua cuộc</h3>
            <button 
              onClick={() => { setGameOver(false); setScore(0); directionRef.current = null; }} 
              className="px-8 py-3 btn-gradient text-white font-black rounded-2xl active:scale-95 text-sm uppercase tracking-widest"
            >
              Chơi lại
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-10">
        <div />
        <button onClick={() => handleDirection("UP")} className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 text-indigo-500 transition-all">▲</button>
        <div />
        <button onClick={() => handleDirection("LEFT")} className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 text-indigo-500 transition-all">◀</button>
        <button onClick={() => handleDirection("DOWN")} className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 text-indigo-500 transition-all">▼</button>
        <button onClick={() => handleDirection("RIGHT")} className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-2xl shadow-lg active:scale-90 text-indigo-500 transition-all">▶</button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState<ViewState>('AUTH');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<User['role']>('student');
  const [authData, setAuthData] = useState({ name: '', nickname: '', email: '', password: '', confirmPassword: '', secretCode: '' });
  const [authError, setAuthError] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'register' | 'forgot_password' | 'change_password'>('register');

  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  const [pendingLesson, setPendingLesson] = useState<Lesson | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [examResult, setExamResult] = useState<{ score: number, total: number } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [contactForm, setContactForm] = useState({ subject: '', content: '' });
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [newLessonData, setNewLessonData] = useState({ title: '', subject: '', videoUrl: '', content: '', isLocal: false, thumbnail: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarUploadRef = useRef<HTMLInputElement>(null);
  const lessonVideoRef = useRef<HTMLInputElement>(null);
  const lessonThumbnailRef = useRef<HTMLInputElement>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const localExams = localStorage.getItem('eduexam_custom_exams');
    const localUsers = localStorage.getItem('eduexam_database');
    const localLessons = localStorage.getItem('eduexam_lessons');
    const localMessages = localStorage.getItem('eduexam_messages');
    
    setAllExams([...SAMPLE_EXAMS, ...(localExams ? JSON.parse(localExams) : [])]);
    setAllUsers(localUsers ? JSON.parse(localUsers) : []);
    setAllLessons([...INITIAL_LESSONS, ...(localLessons ? JSON.parse(localLessons) : [])]);
    setContactMessages(localMessages ? JSON.parse(localMessages) : []);

    const savedUser = localStorage.getItem('eduexam_user_session');
    if (savedUser) { 
        const u = JSON.parse(savedUser); 
        setUser(u); 
        setProfileData(u);
        setView('DASHBOARD'); 
    }
    const savedTheme = localStorage.getItem('eduexam_theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      handleFinalSubmit();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timeLeft]);

  const toggleTheme = () => { const n = !isDarkMode; setIsDarkMode(n); localStorage.setItem('eduexam_theme', n ? 'dark' : 'light'); };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError('');
    if (selectedRole === 'teacher' && authData.secretCode !== ADMIN_SECRET_CODE) { setAuthError('Mã Admin không chính xác!'); return; }
    if (authMode === 'register' && authData.password !== authData.confirmPassword) { setAuthError('Mật khẩu không khớp!'); return; }
    
    setIsLoading(true);
    if (authMode === 'register') {
      if (allUsers.some(u => u.email === authData.email)) { setAuthError('Email này đã được sử dụng.'); setIsLoading(false); return; }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp); setOtpPurpose('register');
      const res = await sendOTPEmail(authData.email, authData.name, otp);
      setIsLoading(false); if (res.success) setIsVerifyingOTP(true); else setAuthError(res.error || 'Lỗi gửi mã OTP.');
    } else {
      const found = allUsers.find(u => u.email === authData.email && u.password === authData.password && u.role === selectedRole);
      setIsLoading(false);
      if (found) { setUser(found); setProfileData(found); localStorage.setItem('eduexam_user_session', JSON.stringify(found)); setView('DASHBOARD'); }
      else setAuthError('Email hoặc mật khẩu không đúng.');
    }
  };

  const deleteExam = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    const updated = allExams.filter(e => e.id !== id);
    setAllExams(updated);
    const customExams = updated.filter(e => !SAMPLE_EXAMS.find(se => se.id === e.id));
    localStorage.setItem('eduexam_custom_exams', JSON.stringify(customExams));
    alert("Đã xóa đề thi thành công!");
  };

  const deleteLesson = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài giảng này?")) return;
    const updated = allLessons.filter(l => l.id !== id);
    setAllLessons(updated);
    const customLessons = updated.filter(l => !INITIAL_LESSONS.find(il => il.id === l.id));
    localStorage.setItem('eduexam_lessons', JSON.stringify(customLessons));
    alert("Đã xóa bài giảng thành công!");
  };

  const handleForgotPassword = async (purpose: 'forgot_password' | 'change_password') => {
    const email = (purpose === 'change_password' && user) ? user.email : authData.email;
    if(!email) { alert("Vui lòng nhập email trước!"); return; }
    setIsLoading(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp); setOtpPurpose(purpose);
    const res = await sendOTPEmail(email, user?.name || "Bạn học", otp);
    setIsLoading(false); if (res.success) setIsVerifyingOTP(true); else alert("Lỗi khi gửi mã xác nhận.");
  };

  const verifyOTP = () => {
    if (otpValue.trim() !== generatedOtp.trim()) { alert('Mã OTP không chính xác!'); return; }
    setIsVerifyingOTP(false);
    if (otpPurpose === 'register') {
      const newUser: User = { id: 'u' + Date.now(), name: authData.name, email: authData.email, password: authData.password, role: selectedRole, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${authData.name}`, nickname: authData.name };
      const updated = [...allUsers, newUser]; setAllUsers(updated); localStorage.setItem('eduexam_database', JSON.stringify(updated));
      setUser(newUser); setProfileData(newUser); localStorage.setItem('eduexam_user_session', JSON.stringify(newUser)); setView('DASHBOARD');
    } else {
        setView('FORGOT_PASSWORD');
    }
  };

  const startExam = (exam: Exam) => {
    setCurrentExam(exam); setUserAnswers({}); setTimeLeft(exam.duration * 60); setIsTimerRunning(true); setView('EXAM');
  };

  const handleFinalSubmit = () => {
    setIsTimerRunning(false); if (timerRef.current) clearInterval(timerRef.current);
    if (!currentExam) return;
    let s = 0; currentExam.questions.forEach(q => { if(userAnswers[q.id] === q.correctAnswer) s++; });
    setExamResult({ score: s, total: currentExam.questions.length }); setShowExplanations(false); setView('RESULT');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileData(prev => ({...prev, avatar: reader.result as string}));
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    const updatedUsers = allUsers.map(u => u.id === user?.id ? { ...u, ...profileData } : u);
    setAllUsers(updatedUsers);
    localStorage.setItem('eduexam_database', JSON.stringify(updatedUsers));
    const finalUser = { ...user, ...profileData } as User;
    setUser(finalUser);
    localStorage.setItem('eduexam_user_session', JSON.stringify(finalUser));
    alert("Cập nhật hồ sơ thành công!");
  };

  const sendContact = () => {
    if(!contactForm.subject || !contactForm.content) return;
    const newMessage: ContactMessage = {
      id: 'msg-' + Date.now(),
      senderId: user?.id || '',
      senderName: user?.name || '',
      senderEmail: user?.email || '',
      subject: contactForm.subject,
      content: contactForm.content,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    const updated = [newMessage, ...contactMessages];
    setContactMessages(updated);
    localStorage.setItem('eduexam_messages', JSON.stringify(updated));
    setContactForm({ subject: '', content: '' });
    alert("Yêu cầu đã được gửi tới giảng viên!");
  };

  const handleLocalVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setNewLessonData(prev => ({...prev, videoUrl, isLocal: true}));
      if (captureVideoRef.current) {
        captureVideoRef.current.src = videoUrl;
        captureVideoRef.current.load();
      }
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setNewLessonData(prev => ({...prev, thumbnail: reader.result as string}));
      reader.readAsDataURL(file);
    }
  };

  const captureFrame = () => {
    const video = captureVideoRef.current;
    if (!video) { alert("Vui lòng tải video lên trước!"); return; }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setNewLessonData(prev => ({...prev, thumbnail: canvas.toDataURL('image/jpeg', 0.8)}));
        alert("Đã tạo ảnh bìa từ khung hình video!");
      }
    } catch (err) {
      alert("Không thể cắt ảnh từ video này. Hãy thử tải ảnh lên thủ công.");
    }
  };

  const goToLessonPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonData.thumbnail) { alert("Vui lòng chọn hoặc chụp ảnh bìa cho bài giảng!"); return; }
    const newLesson: Lesson = {
      id: 'ls-' + Date.now(),
      title: newLessonData.title,
      subject: newLessonData.subject,
      author: user?.name || 'Admin',
      authorId: user?.id || 'admin',
      thumbnail: newLessonData.thumbnail,
      content: newLessonData.content,
      createdAt: new Date().toISOString(),
      videoUrl: newLessonData.videoUrl,
      isLocalVideo: newLessonData.isLocal
    };
    setPendingLesson(newLesson);
    setView('LESSON_PREVIEW');
  };

  const confirmUploadLesson = () => {
    if (!pendingLesson) return;
    const updated = [pendingLesson, ...allLessons];
    setAllLessons(updated);
    localStorage.setItem('eduexam_lessons', JSON.stringify(updated.filter(l => !INITIAL_LESSONS.find(il => il.id === l.id))));
    setNewLessonData({ title: '', subject: '', videoUrl: '', content: '', isLocal: false, thumbnail: '' });
    setPendingLesson(null);
    setView('LESSONS');
    alert("Đã đăng bài giảng thành công!");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const containerClass = isDarkMode ? "text-slate-200" : "text-slate-900";
  const cardClass = "glass rounded-[2rem] border transition-all duration-300";
  const inputClass = `w-full p-4 rounded-2xl outline-none border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800 focus:border-indigo-500 text-white' : 'bg-white border-slate-200 focus:border-indigo-500 text-slate-900'}`;

  const NavItem = ({ viewName, label, icon }: { viewName: ViewState, label: string, icon: string }) => (
    <button 
      onClick={() => { setView(viewName); setIsMenuOpen(false); }} 
      className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black tracking-[0.1em] uppercase transition-all duration-300 ${view === viewName ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:bg-indigo-600/10'}`}
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-500 ${containerClass}`}>
      
      {(isLoading || isAIProcessing) && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center backdrop-blur-3xl bg-slate-950/40">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black text-indigo-500 uppercase tracking-widest text-xs animate-pulse">EduExam AI đang xử lý...</p>
        </div>
      )}

      {view === 'AUTH' && (
        <div className="min-h-screen w-full flex items-center justify-center p-6 animate-in fade-in duration-700">
          <div className={`w-full max-w-md ${cardClass} p-8 md:p-12 shadow-2xl`}>
            {!isVerifyingOTP ? (
              <>
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl animate-float">🎓</div>
                  <h1 className="text-3xl font-black tracking-tighter">EduExam AI</h1>
                  <p className="text-slate-500 text-sm mt-2">Tương lai của học tập thông minh</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8 bg-slate-900/20 p-1 rounded-2xl">
                  <button onClick={() => setAuthMode('login')} className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Đăng nhập</button>
                  <button onClick={() => setAuthMode('register')} className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Đăng ký</button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="flex gap-2 mb-4">
                     {[ {k:'student', v:'Học sinh'}, {k:'teacher', v:'Giảng viên'} ].map((r) => (
                       <button key={r.k} type="button" onClick={() => setSelectedRole(r.k as any)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${selectedRole === r.k ? 'border-indigo-600 bg-indigo-600/10 text-indigo-500' : 'border-slate-800 text-slate-500'}`}>{r.v}</button>
                     ))}
                  </div>
                  {authMode === 'register' && <input type="text" placeholder="Họ và tên" className={inputClass} value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} required />}
                  <input type="email" placeholder="Địa chỉ Email" className={inputClass} value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
                  <input type="password" placeholder="Mật khẩu" className={inputClass} value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
                  {authMode === 'register' && <input type="password" placeholder="Xác nhận mật khẩu" className={inputClass} value={authData.confirmPassword} onChange={e => setAuthData({...authData, confirmPassword: e.target.value})} required />}
                  {selectedRole === 'teacher' && <input type="text" placeholder="Mã bí mật Admin" className={inputClass} value={authData.secretCode} onChange={e => setAuthData({...authData, secretCode: e.target.value})} required />}
                  
                  {authError && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-bounce">{authError}</p>}
                  
                  <button type="submit" className="w-full btn-gradient text-white font-black py-5 rounded-3xl uppercase tracking-widest shadow-xl mt-4">
                    {authMode === 'login' ? 'Bắt đầu ngay' : 'Tham gia cộng đồng'}
                  </button>
                </form>
                {authMode === 'login' && <button onClick={() => handleForgotPassword('forgot_password')} className="w-full mt-6 text-[10px] font-black text-slate-500 hover:text-indigo-500 uppercase tracking-widest transition-all">Quên mật khẩu?</button>}
              </>
            ) : (
              <div className="text-center animate-in zoom-in duration-300">
                <div className="text-5xl mb-6">📩</div>
                <h2 className="text-2xl font-black mb-4">Xác thực Email</h2>
                <p className="text-sm text-slate-500 mb-10">Chúng tôi đã gửi mã 6 số đến email của bạn.</p>
                <input type="text" maxLength={6} className="w-full bg-transparent border-b-4 border-indigo-600 py-4 text-center text-5xl font-black outline-none mb-10 tracking-[0.5em]" value={otpValue} onChange={e => setOtpValue(e.target.value)} />
                <button onClick={verifyOTP} className="w-full btn-gradient text-white font-black py-5 rounded-3xl uppercase tracking-widest">Xác nhận ngay</button>
              </div>
            )}
          </div>
        </div>
      )}

      {view !== 'AUTH' && (
        <>
          <div className="md:hidden flex items-center justify-between p-6 glass sticky top-0 z-[100] border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-lg">🎓</div>
              <span className="font-black text-white text-lg tracking-tighter">EduExam</span>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-12 h-12 flex items-center justify-center glass rounded-2xl text-white">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          <nav className={`fixed inset-0 md:static md:flex md:w-80 flex flex-col p-8 gap-3 transition-all duration-500 z-[200] ${isDarkMode ? 'glass border-r' : 'bg-white border-r shadow-2xl'} ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="hidden md:flex items-center gap-4 mb-12 px-2">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-600/30">🎓</div>
              <span className="text-xl font-black tracking-tighter">EduExam AI</span>
            </div>
            
            <div className="flex flex-col gap-2 flex-1">
              <NavItem viewName="DASHBOARD" label="Trang chủ" icon="🏠" />
              <NavItem viewName="LESSONS" label="Khóa học" icon="📚" />
              <NavItem viewName="COMMUNITY" label="Gia sư AI" icon="🤖" />
              <NavItem viewName="CONTACT" label="Hỗ trợ" icon="📞" />
              <NavItem viewName="GAME_SNAKE" label="Giải trí" icon="🎮" />
              {user?.role === 'teacher' && <NavItem viewName="ADMIN_PANEL" label="Quản trị" icon="🛠️" />}
            </div>

            <div className="pt-8 border-t border-slate-800/50 flex flex-col gap-4">
              <button onClick={toggleTheme} className="w-full py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                {isDarkMode ? '☀️ Chế độ sáng' : '🌙 Chế độ tối'}
              </button>
              
              <button onClick={() => { setView('PROFILE'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 rounded-3xl glass border hover:border-indigo-500 transition-all text-left">
                <img src={profileData.avatar || user?.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg" alt="avatar" />
                <div className="overflow-hidden">
                  <span className="text-xs font-black block truncate">{user?.name}</span>
                  <span className="text-[9px] text-indigo-500 uppercase font-black tracking-widest">{user?.role === 'teacher' ? 'Giảng viên' : 'Học sinh'}</span>
                </div>
              </button>
              
              <button onClick={() => { localStorage.removeItem('eduexam_user_session'); setView('AUTH'); }} className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">Đăng xuất</button>
            </div>
          </nav>

          <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen custom-scroll">
            
            {view === 'DASHBOARD' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom duration-700">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-left">Chào bạn, {user?.nickname}! ✨</h2>
                    <p className="text-slate-500 font-bold max-w-xl leading-relaxed text-left">"Kiến thức là tài sản duy nhất tăng lên khi chia sẻ." Hãy bắt đầu ôn luyện cùng AI ngay hôm nay.</p>
                  </div>
                  <div className="flex items-center gap-2 glass px-6 py-4 rounded-3xl border">
                    <span className="text-xs font-black uppercase text-indigo-500">Thứ hạng</span>
                    <span className="text-2xl font-black text-white">#124</span>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allExams.map((exam) => (
                    <div key={exam.id} className={`${cardClass} p-8 group relative overflow-hidden text-left`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-600/30 transition-all"></div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="inline-block px-4 py-1 bg-indigo-600/10 text-indigo-500 text-[10px] font-black rounded-lg uppercase tracking-widest">{exam.subject}</span>
                        {user?.role === 'teacher' && (
                          <button onClick={() => deleteExam(exam.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      <h3 className="text-2xl font-black mb-8 leading-tight h-16 line-clamp-2">{exam.title}</h3>
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase">
                           <span>⏱️ {exam.duration} phút</span>
                           <span>•</span>
                           <span>📄 {exam.questions.length} câu</span>
                         </div>
                      </div>
                      <button onClick={() => startExam(exam)} className="w-full py-5 btn-gradient text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg">Làm bài ngay</button>
                    </div>
                  ))}
                  {allExams.length === 0 && <div className="col-span-full py-20 text-center opacity-30 italic">Chưa có đề thi nào. Hãy số hóa đề ngay!</div>}
                </div>
              </div>
            )}

            {view === 'LESSONS' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
                <h2 className="text-4xl font-black tracking-tighter text-left">Thư viện bài giảng 📚</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {allLessons.map(ls => (
                    <div key={ls.id} className={`group cursor-pointer rounded-[2.5rem] overflow-hidden ${cardClass} hover:border-indigo-500 shadow-xl relative`}>
                      {user?.role === 'teacher' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteLesson(ls.id); }} className="absolute top-4 right-4 z-10 p-3 glass bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                      <div className="relative h-64 overflow-hidden" onClick={() => { setSelectedLesson(ls); setView('LESSON_DETAIL'); }}>
                        <img src={ls.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="lesson" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 text-left">
                           <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">{ls.subject}</span>
                        </div>
                      </div>
                      <div className="p-8 text-left" onClick={() => { setSelectedLesson(ls); setView('LESSON_DETAIL'); }}>
                        <h3 className="text-2xl font-black mb-4 leading-tight line-clamp-2">{ls.title}</h3>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-black text-[10px] text-indigo-500 uppercase">{ls.author[0]}</div>
                           <span className="text-xs font-bold text-slate-500">{ls.author}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'COMMUNITY' && (
              <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-in zoom-in duration-500">
                <div className={`${cardClass} flex-1 flex flex-col overflow-hidden shadow-2xl`}>
                  <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-indigo-600/5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🤖</div>
                      <div className="text-left">
                        <h3 className="text-xl font-black tracking-tight">Gia sư AI</h3>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sẵn sàng hỗ trợ</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <span className="text-6xl mb-6">💡</span>
                        <p className="max-w-sm font-bold leading-relaxed italic">Hãy hỏi mình bất cứ điều gì về bài học hoặc đề thi nhé!</p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'btn-gradient text-white rounded-tr-none' : 'glass border border-slate-700 text-slate-200 rounded-tl-none text-left'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault(); if(!chatInput.trim()) return;
                    const m = chatInput; setChatInput('');
                    setChatHistory(prev => [...prev, {role:'user', text:m}]);
                    const res = await chatWithAI(chatHistory.map(h => ({role:h.role, parts:[{text:h.text}]})), m, {view});
                    setChatHistory(prev => [...prev, {role:'model', text:res}]);
                  }} className="p-8 border-t border-slate-800/50 bg-slate-900/10 flex gap-4">
                    <input type="text" placeholder="Nhập câu hỏi của bạn..." className={`${inputClass} shadow-inner`} value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button className="px-10 py-4 btn-gradient text-white rounded-2xl font-black uppercase text-[10px] shadow-xl transition-all">Gửi</button>
                  </form>
                </div>
              </div>
            )}

            {view === 'ADMIN_PANEL' && user?.role === 'teacher' && (
              <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 text-left">
                <h2 className="text-4xl font-black tracking-tighter">Bảng điều khiển Giảng viên 🛠️</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className={`p-10 ${cardClass} shadow-xl`}>
                     <h3 className="text-2xl font-black mb-8 flex items-center gap-4">🎬 Đăng tải bài giảng</h3>
                     <form onSubmit={goToLessonPreview} className="space-y-6">
                        <input type="text" placeholder="Tiêu đề bài học" className={inputClass} value={newLessonData.title} onChange={e => setNewLessonData({...newLessonData, title: e.target.value})} required />
                        <input type="text" placeholder="Môn học (ví dụ: Toán học)" className={inputClass} value={newLessonData.subject} onChange={e => setNewLessonData({...newLessonData, subject: e.target.value})} required />
                        
                        <div className="space-y-4">
                           <div className="p-8 border-4 border-dashed border-slate-800/50 rounded-[2.5rem] text-center hover:border-indigo-500 transition-all group bg-slate-900/10">
                              <input type="file" ref={lessonVideoRef} className="hidden" accept="video/*" onChange={handleLocalVideoSelect} />
                              {newLessonData.videoUrl ? (
                                <div className="space-y-4">
                                  {newLessonData.isLocal && <video ref={captureVideoRef} src={newLessonData.videoUrl} className="max-h-48 mx-auto rounded-3xl" />}
                                  <div className="flex gap-2">
                                     <button type="button" onClick={captureFrame} className="flex-1 py-3 glass rounded-xl text-[10px] font-black uppercase text-indigo-500 border border-indigo-500/20">Chụp ảnh bìa</button>
                                     <button type="button" onClick={() => lessonThumbnailRef.current?.click()} className="flex-1 py-3 glass rounded-xl text-[10px] font-black uppercase text-amber-500 border border-amber-500/20">Tải ảnh bìa</button>
                                     <input type="file" ref={lessonThumbnailRef} className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => lessonVideoRef.current?.click()}>
                                  <span className="text-5xl group-hover:scale-110 transition-transform">🎥</span>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chọn tệp Video bài giảng</p>
                                </div>
                              )}
                           </div>
                           {newLessonData.thumbnail && (
                             <div className="flex items-center gap-4 p-4 glass rounded-3xl border border-indigo-500/30">
                               <img src={newLessonData.thumbnail} className="w-20 h-20 rounded-2xl object-cover" alt="preview" />
                               <span className="text-[10px] font-black uppercase text-indigo-500">Ảnh bìa đã chọn ✨</span>
                             </div>
                           )}
                        </div>

                        <textarea placeholder="Mô tả nội dung bài học..." rows={4} className={inputClass} value={newLessonData.content} onChange={e => setNewLessonData({...newLessonData, content: e.target.value})} required />
                        <button className="w-full btn-gradient py-5 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl">Xem trước & Đăng bài</button>
                     </form>
                   </div>

                   <div className="flex flex-col justify-center gap-8">
                     <div className={`p-12 ${cardClass} shadow-xl text-center flex flex-col items-center gap-8`}>
                        <h3 className="text-2xl font-black uppercase tracking-widest text-indigo-500">📄 Quét đề AI</h3>
                        <p className="text-slate-500 text-sm max-w-sm">Tải lên ảnh chụp hoặc tệp PDF đề thi trắc nghiệm. Gemini AI sẽ tự động số hóa ngay lập tức.</p>
                        <div onClick={() => fileInputRef.current?.click()} className="w-full py-16 border-4 border-dashed border-slate-800/50 rounded-[3rem] cursor-pointer hover:border-indigo-500 group bg-slate-900/10 transition-all">
                           <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform">📷</span>
                           <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Chọn tệp đề thi</span>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => {
                          const f = e.target.files?.[0]; if(f) {
                            const reader = new FileReader(); 
                            reader.onload = async () => {
                              setIsAIProcessing(true);
                              try {
                                const base64 = (reader.result as string).split(',')[1];
                                const res = await createExamFromFile(base64, f.type);
                                setPendingExam({...res, id: 'ai-'+Date.now()});
                                setView('EXAM_PREVIEW');
                              } catch(err:any) { 
                                alert("Lỗi phân tích đề: " + (err.message || "Vui lòng thử lại.")); 
                              } finally { setIsAIProcessing(false); }
                            };
                            reader.readAsDataURL(f);
                          }
                        }} />
                     </div>
                   </div>
                </div>
              </div>
            )}

            {view === 'EXAM' && currentExam && (
              <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-500 pb-32 text-left">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 sticky top-4 z-[90] glass p-6 rounded-[2.5rem] border border-indigo-500/30">
                  <div className="text-left">
                    <h2 className="text-2xl font-black tracking-tight">{currentExam.title}</h2>
                    <p className="text-indigo-500 font-black uppercase text-[10px] tracking-widest">{currentExam.subject}</p>
                  </div>
                  <div className={`px-10 py-4 rounded-[2rem] border-4 font-black text-3xl shadow-2xl transition-all ${timeLeft < 60 ? 'border-red-500 text-red-500 animate-pulse bg-red-500/10' : 'border-indigo-600 text-indigo-500 bg-indigo-600/10'}`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="space-y-10">
                  {currentExam.questions.map((q, idx) => (
                    <div key={q.id} className={`p-10 ${cardClass} shadow-xl relative`}>
                       <h3 className="text-xl md:text-2xl font-black mb-10 leading-relaxed text-left">
                         <span className="text-indigo-500 mr-4">Câu {idx + 1}:</span>{q.text}
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, oi) => (
                            <button key={oi} onClick={() => setUserAnswers({...userAnswers, [q.id]: oi})} className={`p-6 rounded-3xl text-left font-bold transition-all border-2 flex items-center gap-6 ${userAnswers[q.id] === oi ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                               <span className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border-2 ${userAnswers[q.id] === oi ? 'border-white bg-white/20' : 'border-slate-800'}`}>{String.fromCharCode(65 + oi)}</span>
                               <span className="text-sm">{opt}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-[100]"><button onClick={handleFinalSubmit} className="w-full py-6 btn-gradient text-white font-black rounded-[2rem] uppercase tracking-widest shadow-2xl text-sm transition-all hover:scale-105 active:scale-95">Nộp bài ngay</button></div>
              </div>
            )}

            {view === 'RESULT' && examResult && (
              <div className="max-w-4xl mx-auto text-center animate-in zoom-in duration-700">
                <div className={`p-12 md:p-20 ${cardClass} shadow-2xl mb-12 relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                  <h2 className="text-4xl md:text-5xl font-black mb-12 tracking-tighter uppercase">Kết quả thi</h2>
                  <div className="flex justify-center gap-16 mb-16">
                    <div className="flex flex-col"><span className="text-7xl font-black text-indigo-500">{examResult.score}</span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Câu đúng</span></div>
                    <div className="flex flex-col border-l border-slate-800/50 pl-16"><span className="text-7xl font-black text-slate-400">{examResult.total}</span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Tổng câu</span></div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={() => setView('DASHBOARD')} className="px-12 py-5 glass rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-700">Về trang chủ</button>
                    <button onClick={() => setShowExplanations(!showExplanations)} className="px-12 py-5 btn-gradient text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{showExplanations ? 'Ẩn lời giải' : 'Xem lời giải'}</button>
                  </div>
                </div>
                {showExplanations && currentExam && (
                  <div className="space-y-8 text-left animate-in slide-in-from-bottom duration-700 pb-20">
                     {currentExam.questions.map((q, idx) => (
                       <div key={idx} className={`p-10 ${cardClass} shadow-xl`}>
                          <p className="font-black text-lg mb-8 leading-relaxed">Câu {idx + 1}: {q.text}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            {q.options.map((o, oi) => (
                              <div key={oi} className={`p-4 rounded-2xl text-xs border-2 ${oi === q.correctAnswer ? 'bg-green-500/20 border-green-500 text-green-500 font-black' : (userAnswers[q.id] === oi ? 'bg-red-500/20 border-red-600 text-red-500 font-black' : 'border-slate-800 opacity-50')}`}>
                                {String.fromCharCode(65 + oi)}. {o}
                              </div>
                            ))}
                          </div>
                          <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-3xl text-sm text-indigo-400 italic leading-relaxed">
                             <span className="font-black not-italic text-indigo-500 block mb-2 uppercase tracking-widest text-[10px]">Giải thích chi tiết</span>
                             {q.explanation}
                          </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            )}

            {view === 'GAME_SNAKE' && (
              <div className="max-w-4xl mx-auto flex flex-col items-center animate-in zoom-in duration-700 py-10">
                <header className="text-center mb-10">
                   <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">Rắn Neon 🐍</h2>
                   <p className="text-slate-500 font-bold italic">Giải lao một chút để tinh thần minh mẫn hơn nhé!</p>
                </header>
                <SnakeGame isDark={isDarkMode} />
              </div>
            )}

            {view === 'PROFILE' && (
              <div className="max-w-3xl mx-auto animate-in slide-in-from-right duration-500">
                <h2 className="text-4xl font-black tracking-tighter mb-12 text-left">Hồ sơ cá nhân 👤</h2>
                <div className={`p-10 md:p-16 ${cardClass} shadow-2xl space-y-12`}>
                   <div className="flex flex-col items-center">
                      <div className="relative group">
                        <img src={profileData.avatar || user?.avatar} className="w-40 h-40 rounded-[3rem] bg-slate-800 object-cover shadow-2xl border-8 border-indigo-600/10 group-hover:border-indigo-600 transition-all duration-500" alt="avatar" />
                        <button onClick={() => avatarUploadRef.current?.click()} className="absolute bottom-2 right-2 w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl shadow-xl hover:scale-110 active:scale-95 transition-all">📸</button>
                      </div>
                      <input type="file" ref={avatarUploadRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Họ và tên</label>
                       <input type="text" className={inputClass} value={profileData.name || ''} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                     </div>
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Biệt danh</label>
                       <input type="text" className={inputClass} value={profileData.nickname || ''} onChange={e => setProfileData({...profileData, nickname: e.target.value})} />
                     </div>
                   </div>
                   <div className="pt-10 flex flex-col md:flex-row gap-4">
                     <button onClick={saveProfile} className="flex-1 btn-gradient py-5 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl">Lưu thay đổi</button>
                     <button onClick={() => handleForgotPassword('change_password')} className="flex-1 py-5 glass rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-500 border border-red-500/20">Đổi mật khẩu</button>
                   </div>
                </div>
              </div>
            )}

            {view === 'LESSON_DETAIL' && selectedLesson && (
              <div className="max-w-6xl mx-auto animate-in zoom-in duration-500">
                <button onClick={() => setView('LESSONS')} className="mb-8 flex items-center gap-3 text-slate-500 font-black uppercase text-[10px] hover:text-indigo-500 transition-all">← Quay lại thư viện</button>
                <div className={`overflow-hidden ${cardClass} shadow-2xl`}>
                  <div className="aspect-video bg-black relative">
                    {selectedLesson.isLocalVideo ? <video src={selectedLesson.videoUrl} controls className="w-full h-full" /> : <iframe src={selectedLesson.videoUrl?.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen title={selectedLesson.title} />}
                  </div>
                  <div className="p-10 md:p-16 text-left">
                    <span className="px-5 py-2 bg-indigo-600/10 text-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 inline-block">{selectedLesson.subject}</span>
                    <h2 className="text-4xl font-black mb-10 leading-tight">{selectedLesson.title}</h2>
                    <div className="prose prose-invert max-w-none text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">{selectedLesson.content}</div>
                  </div>
                </div>
              </div>
            )}

            {view === 'LESSON_PREVIEW' && pendingLesson && (
              <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 pb-20">
                <h2 className="text-4xl font-black mb-10 tracking-tighter text-center uppercase">Xem trước bài giảng 👁️</h2>
                <div className={`${cardClass} overflow-hidden shadow-2xl text-left`}>
                   <img src={pendingLesson.thumbnail} className="w-full h-80 object-cover" alt="thumb" />
                   <div className="p-10">
                     <h2 className="text-3xl font-black mb-6">{pendingLesson.title}</h2>
                     <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{pendingLesson.content}</p>
                   </div>
                </div>
                <div className="flex gap-4 mt-10"><button onClick={() => setView('ADMIN_PANEL')} className="flex-1 py-5 glass rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-700">Chỉnh sửa tiếp</button><button onClick={confirmUploadLesson} className="flex-1 py-5 btn-gradient text-white rounded-2xl font-black uppercase text-xs shadow-xl">Xác nhận & Đăng bài</button></div>
              </div>
            )}

            {view === 'EXAM_PREVIEW' && pendingExam && (
              <div className="max-w-4xl mx-auto animate-in zoom-in duration-500 pb-20">
                <h2 className="text-4xl font-black mb-10 tracking-tighter text-center uppercase">Kết quả quét AI ✨</h2>
                <div className={`p-10 ${cardClass} shadow-2xl space-y-8 text-left`}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tiêu đề đề thi</label>
                       <input className={inputClass} value={pendingExam.title} onChange={e => setPendingExam({...pendingExam, title: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Môn học</label>
                       <input className={inputClass} value={pendingExam.subject} onChange={e => setPendingExam({...pendingExam, subject: e.target.value})} />
                     </div>
                   </div>
                   <div className="max-h-[500px] overflow-y-auto pr-4 space-y-4 custom-scroll">
                      {pendingExam.questions.map((q, idx) => (
                        <div key={idx} className="p-6 glass rounded-3xl border border-slate-700/50">
                           <p className="font-black text-xs mb-4">Câu {idx+1}: {q.text}</p>
                           <div className="grid grid-cols-2 gap-2">
                             {q.options.map((o, oi) => <div key={oi} className={`p-3 rounded-xl text-[10px] ${q.correctAnswer === oi ? 'bg-green-500 text-white font-black' : 'bg-slate-800 text-slate-500'}`}>{o}</div>)}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="flex gap-4 mt-10"><button onClick={() => setView('ADMIN_PANEL')} className="flex-1 py-5 glass rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-700">Hủy bỏ</button><button onClick={() => { setAllExams([pendingExam, ...allExams]); setView('DASHBOARD'); alert("Đã lưu đề thi thành công!"); }} className="flex-1 py-5 btn-gradient text-white rounded-2xl font-black uppercase text-xs shadow-xl">Phê duyệt & Lưu đề</button></div>
              </div>
            )}

            {view === 'CONTACT' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 text-left">
                <h2 className="text-4xl font-black tracking-tighter">Hỗ trợ & Liên hệ 📞</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className={`p-10 ${cardClass} shadow-2xl`}>
                    <h3 className="text-xl font-black mb-8 uppercase tracking-widest text-indigo-500">Gửi thắc mắc</h3>
                    <form onSubmit={(e) => { e.preventDefault(); sendContact(); }} className="space-y-6">
                      <input type="text" placeholder="Chủ đề hỗ trợ" className={inputClass} value={contactForm.subject} onChange={e => setContactForm({...contactForm, subject: e.target.value})} required />
                      <textarea rows={6} placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..." className={inputClass} value={contactForm.content} onChange={e => setContactForm({...contactForm, content: e.target.value})} required />
                      <button className="w-full btn-gradient py-5 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl">Gửi yêu cầu</button>
                    </form>
                  </div>
                  <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scroll">
                    {contactMessages.filter(m => m.senderId === user?.id || user?.role === 'teacher').map(msg => (
                      <div key={msg.id} className={`p-8 ${cardClass} shadow-lg relative`}>
                         <div className="flex justify-between items-start mb-4">
                           <h4 className="font-black text-lg">{msg.subject}</h4>
                           <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${msg.status === 'replied' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>{msg.status === 'replied' ? 'Đã phản hồi' : 'Đang chờ'}</span>
                         </div>
                         <p className="text-sm text-slate-500 mb-6 italic leading-relaxed">"{msg.content}"</p>
                         {msg.replyContent && <div className="p-6 bg-indigo-600/10 border-l-4 border-indigo-600 rounded-r-2xl text-xs text-indigo-400 font-bold leading-relaxed">Giảng viên trả lời: {msg.replyContent}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <footer className="mt-32 py-12 border-t border-slate-800/50 flex flex-col items-center gap-6 animate-in fade-in duration-1000">
               <div className="flex flex-col items-center gap-6">
                 <a 
                   href="https://zalo.me/0339257735" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="btn-gradient px-8 py-3 text-white font-black rounded-full flex items-center gap-3 shadow-2xl transition-all"
                 >
                   <span className="text-xl">💬</span>
                   <span className="text-xs uppercase tracking-widest">CONTACT ME ON ZALO: 0339257735</span>
                 </a>
                 <div className="flex flex-col items-center opacity-40">
                    <p className="text-[9px] font-black uppercase tracking-[1em] text-indigo-500 mb-2">DEVELOPEDBY</p>
                    <p className="text-[12px] font-black uppercase tracking-[0.2em]">KHANHHUYEN</p>
                 </div>
               </div>
            </footer>
          </main>
        </>
      )}
    </div>
  );
};

export default App;
