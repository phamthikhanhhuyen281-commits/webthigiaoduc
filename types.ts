
export type ViewState = 'AUTH' | 'DASHBOARD' | 'EXAM' | 'EXAM_PREVIEW' | 'RESULT' | 'COMMUNITY' | 'LESSONS' | 'LESSON_DETAIL' | 'CONTACT' | 'ADMIN_PANEL' | 'PROFILE' | 'FORGOT_PASSWORD' | 'GAME_SNAKE' | 'LESSON_PREVIEW';

export type UserRole = 'student' | 'teacher' | 'owner';

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  address?: string;
  plan?: 'free_user' | 'premium_user';
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questions: Question[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  author: string;
  authorId: string;
  thumbnail: string;
  content: string;
  createdAt: string;
  videoUrl?: string;
  fileUrl?: string;
  externalLink?: string;
  isLocalVideo?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ContactMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  createdAt: string;
  status: 'new' | 'replied';
  replyContent?: string;
  repliedAt?: string;
}
