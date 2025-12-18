import { Course, Unit, Lesson } from '../types';

const STORAGE_KEY = 'math_facilitator_data_v1';

const initialData: Course[] = [
  {
    id: 'c1',
    title: '数学 I',
    gradeLevel: '高校1年',
    units: [
      {
        id: 'u1',
        courseId: 'c1',
        title: '数と式',
        lessons: []
      }
    ]
  }
];

export const loadCourses = (): Course[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return initialData;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse storage", e);
    return initialData;
  }
};

export const saveCourses = (courses: Course[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
