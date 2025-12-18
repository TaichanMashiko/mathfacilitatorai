import { Reflection, Course } from '../types';
import { authService } from './authService';

declare var gapi: any;

const SPREADSHEET_ID = '1hX01jtPsy08RAOl4wC4VYIkp6XrSUXX_XTf05IdzFpw';
const REFLECTIONS_SHEET_NAME = 'Reflections';

export const saveReflectionToSheet = async (accessTokenIgnored: string, reflection: Reflection) => {
  // We ignore the passed accessToken because authService manages it inside gapi
  
  // 1. Ensure we have a valid token
  await authService.ensureAuth();

  const values = [
    [
      reflection.date,
      reflection.studentEmail,
      reflection.lessonId,
      reflection.rating,
      reflection.content
      // Removed aiFeedback
    ]
  ];

  try {
    // 2. Use gapi.client.sheets
    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${REFLECTIONS_SHEET_NAME}!A:A`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to save to sheets: ${response.statusText}`);
    }
    
    return response.result;

  } catch (error) {
    console.error('Error saving reflection:', error);
    throw error;
  }
};

export const loadInitialData = async (): Promise<Course[]> => {
    // This remains a mock for now, but could be easily updated to use gapi.client.sheets.spreadsheets.values.get
    // to load course definitions from a "Configs" sheet.
    return [
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
};