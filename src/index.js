#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const { showBanner, showStep, showHeader, showSuccess } = require('./ui');
const { validateCredentials } = require('./api');
const { scaffoldFiles, installAndFinalize } = require('./scaffold');

const program = new Command();

program
  .name('@pkagentic/create-project')
  .description('Scaffold and configure a PK Agentic project for various MCP-compatible platforms.')
  .version('1.2.2')
  .argument('[project-directory]', 'The directory where the project will be created (defaults to current directory if not provided)')
  .option('--add-gemini-key', 'Enable integration with Google Gemini AI Studio. Your API key will be used for AI-powered image generation within your agents.')
  .option('--skip-ssl-verify', 'Disable SSL certificate validation. Use this if your WordPress site is using a self-signed certificate or if you encounter SSL-related errors during connection.')
  .addHelpText('after', `
Examples:
  $ npx @pkagentic/create-project
  $ npx @pkagentic/create-project my-agent-project
  $ npx @pkagentic/create-project --add-gemini-key
  $ npx @pkagentic/create-project --skip-ssl-verify --add-gemini-key

Supported Platforms:
  This tool generates configuration files for multiple platforms:
  - Claude (Desktop/CLI via .mcp.json)
  - Google Gemini (settings.json)
  - Antigravity CLI (.agents/mcp_config.json)
  - Antigravity Gemini (.gemini/antigravity/mcp_config.json)
  - Cursor (.cursor/mcp.json)
  - Windsurf (mcp_config.json)
  - GitHub Copilot (.vscode/mcp.json)
  - Roo Code (.roo/mcp.json)
  - Codex (.codex/config.toml)
  - OpenCode (opencode.json)
  - Kilocode (.kilocode/mcp.json)
`)
  .action(async (projectDir, options) => {
    try {
      const targetDir = projectDir ? path.resolve(process.cwd(), projectDir) : process.cwd();
      const projectName = projectDir && projectDir !== '.' ? projectDir : path.basename(targetDir);

      showBanner();

      // Ensure directory exists
      await fs.ensureDir(targetDir);

      // Check if directory is empty
      const files = await fs.readdir(targetDir);
      if (files.length > 0) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: chalk.yellow(`The directory ${chalk.bold(targetDir)} is not empty. Continue anyway?`),
          default: true,
        }]);
        if (!proceed) process.exit(0);
      }

      showHeader('Configuration Wizard');

      // Step 1: Enable Agent API
      showStep(1, 'Enable Agent API', 'Open your WordPress dashboard:', [
        'PK Agentic > Settings > Agent Api',
        'Check "Enable Agent Api" and click "Save Settings".'
      ]);
      await inquirer.prompt([{ type: 'input', name: 'done', message: 'Press Enter once ready...' }]);

      // Step 2: Generate API Key
      showStep(2, 'Generate API Key', 'Go to your WordPress settings:', [
        'PK Agentic > Settings > Agent Api > Manage API Keys',
        'Fill in Name, Select User, and click "Generate Key".'
      ]);
      await inquirer.prompt([{ type: 'input', name: 'done', message: 'Press Enter once ready...' }]);

      // Get existing values if files exist
      let existingConfig = {};
      const configPath = path.join(targetDir, '.mcp.json');
      if (await fs.pathExists(configPath)) {
        try {
          const rawConfig = await fs.readJson(configPath);
          const s = rawConfig.mcpServers && rawConfig.mcpServers['pk-agent'];
          if (s) {
            existingConfig = {
              endpoint: s.env.PK_AGENT_API_URL,
              key: s.env.PK_AGENT_KEY,
              email: s.env.PK_AGENT_EMAIL,
              geminiApiKey: s.env.GEMINI_API_KEY
            };
          }
        } catch (e) {}
      }

      // Step 3: Configure Credentials and Validate
      showStep(3, 'Configure Credentials', 'Enter your Agent API details below:');
      
      let config, validationResult;
      let apiValidated = false;

      while (!apiValidated) {
        config = await inquirer.prompt([
          {
            type: 'input',
            name: 'endpoint',
            message: 'Agent API Endpoint:',
            default: existingConfig.endpoint || '',
            validate: (i) => i ? true : 'Required',
          },
          {
            type: 'input',
            name: 'key',
            message: 'Agent API Key:',
            default: existingConfig.key || '',
            validate: (i) => i ? true : 'Required',
          },
          {
            type: 'input',
            name: 'email',
            message: 'Agent API Email:',
            default: existingConfig.email || '',
            validate: (i) => i ? true : 'Required',
          },
          {
            type: 'input',
            name: 'geminiApiKey',
            message: 'Gemini API Key (AI Studio):',
            when: () => !!options.addGeminiKey,
            default: existingConfig.geminiApiKey || '',
          }
        ]);

        validationResult = await validateCredentials(config.endpoint, config.key, config.email, options.skipSslVerify);
        if (validationResult.success) {
          apiValidated = true;
        } else {
          console.log(chalk.yellow('\nLet\'s try entering the credentials again.\n'));
        }
      }

      // Scaffolding
      showHeader('Scaffolding Files');
      const { configs, mcpConfig } = await scaffoldFiles(
        targetDir, 
        projectName, 
        config, 
        validationResult.data, 
        options
      );

      // Installation
      showHeader('Finalizing Setup');
      await installAndFinalize(targetDir, configs, mcpConfig);

      showSuccess('Project setup complete!');
      console.log(chalk.white(`Directory: ${targetDir}\n`));

      console.log(chalk.cyan('Supported Platforms:'));
      console.log(chalk.white('  - Claude (Desktop/CLI via .mcp.json)'));
      console.log(chalk.white('  - Gemini (settings.json)'));
      console.log(chalk.white('  - Antigravity CLI (.agents/mcp_config.json)'));
      console.log(chalk.white('  - Antigravity Gemini (.gemini/antigravity/mcp_config.json)'));
      console.log(chalk.white('  - Cursor (.cursor/mcp.json)'));
      console.log(chalk.white('  - Windsurf (mcp_config.json)'));
      console.log(chalk.white('  - GitHub Copilot (.vscode/mcp.json)'));
      console.log(chalk.white('  - Roo Code (.roo/mcp.json)'));
      console.log(chalk.white('  - Codex (.codex/config.toml)'));
      console.log(chalk.white('  - OpenCode (opencode.json)'));
      console.log(chalk.white('  - Kilocode (.kilocode/mcp.json)\n'));

      if (targetDir !== process.cwd()) {
        const relativePath = path.relative(process.cwd(), targetDir);
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.white(`  cd ${relativePath}`));
        console.log(chalk.white('  # Start using your new agent project!\n'));
      }

    } catch (err) {
      console.error(chalk.red('\nAn error occurred:'), err);
      process.exit(1);
    }
  });

program.parse(process.argv);
