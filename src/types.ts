export interface ReactionResult {
  reaction_occurred: boolean;
  equation: string;
  products: string[];
  visual_effects: {
    color_change: string | null;
    gas_evolution: boolean;
    precipitation: string | null;
    temperature: string;
  };
  educational_note: string;
  danger_level: number;
  quiz_question: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'teacher';
  displayName?: string;
}

export interface HistoryItem {
  id: string;
  studentUid: string;
  studentEmail: string;
  chemicals: string;
  result: ReactionResult;
  timestamp: string;
}
