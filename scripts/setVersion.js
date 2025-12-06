const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get git commit hash
let commitHash = process.env.GITHUB_SHA;

// If not in GitHub Actions, try to get it from git command
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    commitHash = 'unknown';
    console.warn('⚠️  Could not get commit hash from git');
  }
}

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Create/update .env.local with version info
const envPath = path.join(__dirname, '../.env.local');
let envContent = '';

// Read existing .env.local if it exists
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  // Remove old version lines
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('REACT_APP_VERSION=') && !line.startsWith('REACT_APP_COMMIT_HASH='))
    .join('\n');
}

// Add new version lines
envContent += `\nREACT_APP_VERSION=${version}\nREACT_APP_COMMIT_HASH=${commitHash}\n`;

// Write back to .env.local
fs.writeFileSync(envPath, envContent);

console.log(`✅ Version set: v${version} (${commitHash.substring(0, 7)})`);