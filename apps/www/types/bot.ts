export interface Bot {
  name: string;
  description: string;
};

export interface BotWithId extends Bot {
  id: string;
};

export interface ClientBot extends BotWithId {
  instructions?: Instruction[];
  createdAt: number;
  createdBy: BotAuthor;
};

export interface ServerBot extends ClientBot {
  systemInstruction: string;
};

export interface RowServerBot {
  id: string;
  name: string;
  description: string;
  system_instruction: string;
  instructions: Instruction[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BotAuthor {
  name: string;
  verified: boolean;
  domain?: string;
  id: string;
};

export interface Instruction {
  content: string;
};
