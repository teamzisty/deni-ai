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

export interface BotAuthor {
  name: string;
  verified: boolean;
  domain?: string;
  id: string;
};

export interface Instruction {
  content: string;
};
