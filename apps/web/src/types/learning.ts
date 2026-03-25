export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking';

export interface Topic {
  id: string;
  title: string;
  description: string;
}

export interface Skill {
  id: string;
  type: SkillType;
  title: string;          // e.g. "Listening Comprehension"
  topics: Topic[];
}

export interface LevelBucket {
  grammar: string[];      // e.g. ["Present Simple", "Verb To Be"]
  vocabulary: string[];   // e.g. ["Greetings", "Numbers 1-100"]
  expressions: string[];  // e.g. ["How are you?", "Nice to meet you"]
  phonetics?: string[];   // Optional phonetics focus
}

export interface Level {
  id: string;
  code: string;           // "A1", "A2", "B1", "B2", "C1"
  title: string;          // "Basic", "Elementary", "Intermediate", etc.
  description: string;    // "Discover the groundwork of English..."
  creatorName: string;    // "Hadrien Lacroix"
  creatorRole: string;    // "Curriculum Manager"
  creatorAvatar?: string; // URL to avatar image
  progressPercentage: number; // 0 - 100
  skills: Skill[];
  bucket: LevelBucket;    // Highlighted requirements for the level
}
