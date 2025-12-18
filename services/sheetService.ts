import { Reflection, Course, Lesson } from '../types';

const SPREADSHEET_ID = '1hX01jtPsy08RAOl4wC4VYIkp6XrSUXX_XTf05IdzFpw';
const REFLECTIONS_SHEET_NAME = 'Reflections';

// Helper to find column index (A=0, B=1...) - Simplified for append
// We will assume the structure: Date | StudentEmail | LessonId | Rating | Content | AIFeedback

export const saveReflectionToSheet = async (accessToken: string, reflection: Reflection) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${REFLECTIONS_SHEET_NAME}!A:A:append?valueInputOption=USER_ENTERED`;
  
  const values = [
    [
      reflection.date,
      reflection.studentEmail,
      reflection.lessonId,
      reflection.rating,
      reflection.content,
      reflection.aiFeedback
    ]
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sheets API Error:', errorText);
      throw new Error(`Failed to save to sheets: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving reflection:', error);
    throw error;
  }
};

// Mock function to load initial data. 
// In a full version, this would fetch from a 'Lessons' sheet.
// Since the user said "No upload on web app", we serve the static structure or fetch JSON from a sheet cell.
export const loadInitialData = async (): Promise<Course[]> => {
    // For this prototype, we return the hardcoded structure. 
    // If you want to store course definitions in Sheets, we would add a 'fetch' here.
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
            lessons: [] // To be filled by Teacher editing or hardcoded defaults
          }
        ]
      }
    ];
};
