export interface Prerequisite {
  topic: string;
  explanation: string;
  checkQuestion: string;
}

export interface DeepDive {
  title: string;
  content: string;
  discussionPrompt: string;
}

export interface PracticeProblem {
  question: string;
  hint: string;
  answer: string;
}

export interface LessonContent {
  title: string;
  summary: string;
  prerequisites: Prerequisite[];
  mainContent: string;
  deepDive: DeepDive;
  practice: PracticeProblem[];
}

export interface Reflection {
  studentEmail?: string; // Identifier for the student
  lessonId: string;
  date: string;
  content: string;
  rating: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  content: LessonContent;
  // Reflections are now stored in DB (Sheets), not nested here in memory constantly
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  gradeLevel: string;
  units: Unit[];
}

export interface User {
  email: string;
  name: string;
  picture: string;
  // accessToken is now managed internally by AuthService
}

export enum AppView {
  LOGIN = 'LOGIN',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  STUDENT_LEARNING = 'STUDENT_LEARNING',
}