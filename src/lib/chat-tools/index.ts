import { createImageTool } from "./image";
import { createSearchTool } from "./search";
import { createVideoTool } from "./video";
import type { CreateChatToolsOptions } from "./types";

export function createChatTools({
  userId,
  videoMode,
  imageMode,
  webSearch = true,
}: CreateChatToolsOptions) {
  return {
    ...(webSearch ? { search: createSearchTool() } : {}),
    ...(videoMode ? { video: createVideoTool(userId) } : {}),
    ...(imageMode ? { image: createImageTool() } : {}),
  };
}
