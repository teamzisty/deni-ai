import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Check for -t argument
const useTurbopack = process.argv.includes('-t');

// 計測したいディレクトリのパス
const buildDir = path.join(__dirname, '../', '../', 'apps', 'www');

// ディレクトリが存在するか確認
if (!fs.existsSync(buildDir)) {
  console.error(`Directory not found: ${buildDir}`);
  process.exit(1);
}

console.log(`cd ${buildDir}`);
console.time('build time');

// Build command with optional turbopack flag
const buildCommand = useTurbopack ? 'pnpm run build --turbopack' : 'pnpm run build';
const logs = [
  `===== Starting build in ${buildDir} =====`,
  `Using command: ${buildCommand}`,
  `Turbopack mode: ${useTurbopack ? 'Enabled' : 'Disabled'}`,
  `========================================`
]
console.log(logs.join('\n'));

try {
  execSync(buildCommand, {
    cwd: buildDir,  // カレントディレクトリを指定
    stdio: 'inherit' // 出力をそのまま表示
  });
  console.timeEnd('build time');
} catch (err) {
  console.error('An error occurred during the build process:');
  console.timeEnd('build time');
  process.exit(1);
}
