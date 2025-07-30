import { writeFileSync } from 'fs';
import { join } from 'path';

async function fetchModels() {
    try {
        const response = await fetch('https://capi.voids.top/v2/models');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const modelIds = data.data.map((model: { id: string }) => model.id);
        const outputPath = join(__dirname, '../src/voids-ai-chat-settings.ts');

        const fileContent = `
export type VoidsAIChatModelId =
  ${modelIds.map((id: string) => `| "${id}"`).join('\n  ')}
  | (string & {});
`;

        writeFileSync(outputPath, fileContent);
        console.log('Successfully updated model IDs in voids-ai-chat-settings.ts');
    } catch (error) {
        console.error('Error fetching models:', error);
        process.exit(1);
    }
}

fetchModels();
