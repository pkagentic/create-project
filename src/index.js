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
  .description('Scaffold and configure a PK Agentic project')
  .version('1.1.0')
  .argument('[project-directory]', 'Project directory name (defaults to current directory if not provided)')
  .option('--add-gemini-key', 'Include Gemini API Key in configuration')
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

        validationResult = await validateCredentials(config.endpoint, config.key, config.email);
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

    } catch (err) {
      console.error(chalk.red('\nAn error occurred:'), err);
      process.exit(1);
    }
  });

program.parse(process.argv);
