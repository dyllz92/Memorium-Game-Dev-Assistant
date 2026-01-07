
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
}

export interface StoryNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  backstory: string;
  occupation: string;
  maritalStatus: string;
  personalityTraits: string[];
  abilities: string[];
  motivations: string;
  fears: string;
  relationships: string;
  imageUrl?: string;
  createdAt: number;
}

export interface ProjectBrief {
  title: string;
  genre: string;
  artStyle: string;
  worldSetting: string;
  coreMechanicVisuals: string;
  keyCharacters: string;
}

export interface GameElement {
  id: string;
  category: 'premise' | 'mechanic' | 'story' | 'visual' | 'character_arc';
  title: string;
  content: string;
}

export interface GameCodex {
  elements: GameElement[];
  lastUpdated: number;
}

export interface GameIteration {
  id: string;
  timestamp: number;
  changeDescription: string;
  codex: GameCodex;
}

export interface FeedbackNote {
  id: string;
  targetId: string;
  targetType: 'codex' | 'character' | 'task' | 'general';
  targetTitle: string;
  content: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  imageUri?: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface AppState {
  tasks: Task[];
  storyNotes: StoryNote[];
  characters: Character[];
  projectBrief: ProjectBrief;
  codex: GameCodex;
  iterations: GameIteration[];
  feedback: FeedbackNote[];
}
