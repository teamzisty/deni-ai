export type Bot = {
  name: string;
  description: string;
};

export type ClientBot = Bot & {
  id: string;
  instructions?: Instruction[];
  createdAt: number;
  createdBy: BotAuthor;
};

export type ServerBot = ClientBot & {
  systemInstruction: string;
};

export type BotAuthor = {
  name: string;
  verified: boolean;
  domain?: string;
  id: string;
};

export type Instruction = {
  content: string;
};
