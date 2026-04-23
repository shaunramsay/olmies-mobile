const fs = require('node:fs');
const path = require('node:path');

const cwd = process.cwd();

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  const result = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

const mergedEnv = {
  ...parseEnvFile(path.join(cwd, '.env')),
  ...parseEnvFile(path.join(cwd, '.env.local')),
  ...process.env,
};

const requiredVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
];

const missingVars = requiredVars.filter((name) => !mergedEnv[name]?.trim());

if (missingVars.length > 0) {
  console.error('Missing mobile environment variables:');
  for (const name of missingVars) {
    console.error(`- ${name}`);
  }
  console.error('');
  console.error('Create .env.local from .env.example and set the missing values.');
  process.exit(1);
}

console.log('Mobile environment looks good.');
