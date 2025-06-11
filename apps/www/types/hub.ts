export interface HubFileReference {
  id: string; // Unique identifier for the file reference
  name: string; // Original name of the file
  type: string; // MIME type or a general category like 'image', 'document', 'code'
  path?: string; // URL or a path if stored/managed by the system (optional)
  size?: number; // File size in bytes (optional)
  createdAt: number; // Timestamp of when the file was added to the hub
}

export interface Hub {
  id: string; // Unique identifier for the hub (e.g., UUID)
  name: string; // Name of the hub
  description?: string; // Optional description for the hub
  chatSessionIds: string[]; // Array of chat session IDs linked to this hub
  fileReferences: HubFileReference[]; // Array of file references
  customInstructions?: string; // Custom instructions for AI interactions within this hub's context
  createdAt: number; // Timestamp of when the hub was created
  updatedAt: number; // Timestamp of when the hub was last updated
  // Optional: Add other metadata like color-coding, tags, etc. in the future
  // color?: string;
  // tags?: string[];
}
