const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const execa = require('execa');

const scaffoldFiles = async (targetDir, projectName, config, markdownContent, options) => {
  const spinner = ora('Generating project files...').start();
  
  try {
    // package.json
    const pkgJson = {
      name: projectName,
      version: "1.0.0",
      description: "",
      dependencies: {
        "@pkagentic/pkmcp": "latest"
      }
    };
    await fs.writeJson(path.join(targetDir, 'package.json'), pkgJson, { spaces: 2 });

    // MD files
    await fs.writeFile(path.join(targetDir, 'AGENTS.md'), markdownContent);
    await fs.writeFile(path.join(targetDir, 'CLAUDE.md'), '@AGENTS.md');
    await fs.writeFile(path.join(targetDir, 'GEMINI.md'), '@AGENTS.md');
    await fs.writeFile(path.join(targetDir, 'CODEX.md'), '@AGENTS.md');

    // Default bin path (will be updated after npm install)
    const binPath = './node_modules/@pkagentic/pkmcp/dist/index.js';

    // MCP Config
    const mcpConfig = {
      mcpServers: {
        "pk-agent": {
          "command": "node",
          "args": [binPath],
          "env": {
            "PK_AGENT_API_URL": config.endpoint.endsWith('/') ? config.endpoint : `${config.endpoint}/`,
            "PK_AGENT_KEY": config.key,
            "PK_AGENT_EMAIL": config.email
          }
        }
      }
    };

    if (options.skipSslVerify) {
      mcpConfig.mcpServers["pk-agent"].env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    }

    if (options.addGeminiKey) {
      mcpConfig.mcpServers["pk-agent"].env["GEMINI_API_KEY"] = config.geminiApiKey;
    }

    // Write config to all locations
    const configs = [
      path.join(targetDir, '.mcp.json'),
      path.join(targetDir, '.kilocode', 'mcp.json'),
      path.join(targetDir, '.cursor', 'mcp.json'),
      path.join(targetDir, '.gemini', 'settings.json')
    ];

    for (const cPath of configs) {
      await fs.ensureDir(path.dirname(cPath));
      await fs.writeJson(cPath, mcpConfig, { spaces: 2 });
    }

    spinner.succeed(chalk.green('Project files generated!'));
    return { configs, mcpConfig };
  } catch (err) {
    spinner.fail(chalk.red('Failed to generate project files.'));
    throw err;
  }
};

const installAndFinalize = async (targetDir, configs, mcpConfig) => {
  const installSpinner = ora('Running npm install...').start();
  try {
    await execa('npm', ['install'], { cwd: targetDir });
    installSpinner.succeed(chalk.green('Dependencies installed successfully!'));

    // Discover actual bin path
    const possibleBins = [
      path.join(targetDir, 'node_modules', '@pkagentic', 'pkmcp', 'dist', 'index.js'),
      path.join(targetDir, 'node_modules', 'pk-mcp', 'dist', 'index.js')
    ];

    let finalBinPath = './node_modules/@pkagentic/pkmcp/dist/index.js';
    for (const p of possibleBins) {
      if (await fs.pathExists(p)) {
        finalBinPath = './' + path.relative(targetDir, p);
        break;
      }
    }

    // Update all config files with the discovered bin path
    mcpConfig.mcpServers["pk-agent"].args = [finalBinPath];
    for (const cPath of configs) {
      await fs.writeJson(cPath, mcpConfig, { spaces: 2 });
    }

  } catch (err) {
    installSpinner.fail(chalk.red('Failed to install dependencies.'));
    console.log(chalk.yellow('Please run "npm install" manually in the project folder.'));
  }
};

module.exports = { scaffoldFiles, installAndFinalize };
