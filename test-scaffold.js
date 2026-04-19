const path = require('path');
const fs = require('fs-extra');
const { scaffoldFiles } = require('./src/scaffold');

async function runTest() {
  const targetDir = path.join(__dirname, 'test-output');
  const projectName = 'test-project';
  const config = {
    endpoint: 'https://example.com/api',
    key: 'test-key',
    email: 'test@example.com',
    geminiApiKey: 'gemini-key'
  };
  const markdownContent = '# Test Guides';
  const options = {
    addGeminiKey: true,
    skipSslVerify: true
  };

  try {
    console.log('Starting scaffold test...');
    await fs.remove(targetDir);
    await fs.ensureDir(targetDir);

    const { configs } = await scaffoldFiles(targetDir, projectName, config, markdownContent, options);

    const expectedFiles = [
      'package.json',
      'AGENTS.md',
      'CLAUDE.md',
      'GEMINI.md',
      'CODEX.md',
      '.mcp.json',
      '.kilocode/mcp.json',
      '.cursor/mcp.json',
      '.vscode/mcp.json',
      '.roo/mcp.json',
      '.gemini/settings.json',
      '.gemini/antigravity/mcp_config.json',
      '.codeium/windsurf/mcp_config.json',
      '.codex/config.toml',
      'opencode.json'
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(targetDir, file);
      if (await fs.pathExists(filePath)) {
        console.log(`✅ File exists: ${file}`);
      } else {
        console.error(`❌ File MISSING: ${file}`);
        process.exit(1);
      }
    }

    // Verify OpenCode format
    const opencodeContent = await fs.readJson(path.join(targetDir, 'opencode.json'));
    if (opencodeContent.mcp && opencodeContent.mcp['pk-agent'] && opencodeContent.mcp['pk-agent'].type === 'local') {
      console.log('✅ OpenCode format is correct');
    } else {
      console.error('❌ OpenCode format is INCORRECT');
      process.exit(1);
    }

    // Verify Codex format
    const codexContent = await fs.readFile(path.join(targetDir, '.codex', 'config.toml'), 'utf8');
    if (codexContent.includes('[mcp_servers."pk-agent"]') && codexContent.includes('command = "node"')) {
      console.log('✅ Codex format is correct');
    } else {
      console.error('❌ Codex format is INCORRECT');
      process.exit(1);
    }

    // Verify VS Code format
    const vscodeContent = await fs.readJson(path.join(targetDir, '.vscode', 'mcp.json'));
    if (vscodeContent.servers && vscodeContent.servers['pk-agent']) {
      console.log('✅ VS Code format is correct');
    } else {
      console.error('❌ VS Code format is INCORRECT');
      process.exit(1);
    }

    console.log('\nAll tests passed successfully!');
    await fs.remove(targetDir);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
