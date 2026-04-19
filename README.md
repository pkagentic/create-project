# @pkagentic/create-project

Scaffold and configure a PK Agentic project quickly and easily. This tool provides a step-by-step wizard to help you set up your project with the necessary Agent API credentials and configurations.

## Installation

You can run the scaffolder directly using `npx`:

```bash
npx @pkagentic/create-project@latest [project-directory]
```

### Parameters

- `project-directory` (Optional): The directory where the project will be created (defaults to current directory if not provided).

### Options

- `--add-gemini-key`: Enable integration with Google Gemini AI Studio. Your API key will be used for AI-powered image generation within your agents.
- `--skip-ssl-verify`: Disable SSL certificate validation. Use this if your WordPress site is using a self-signed certificate or if you encounter SSL-related errors during connection.
- `-V, --version`: Output the version number.
- `-h, --help`: Display help for the command.

## Usage Examples

```bash
# Standard scaffold in current directory
npx @pkagentic/create-project

# Scaffold in a specific directory
npx @pkagentic/create-project my-new-agent

# Include Gemini API Key in the setup
npx @pkagentic/create-project --add-gemini-key

# Skip SSL verification (useful for local development)
npx @pkagentic/create-project --skip-ssl-verify
```

## Supported Platforms

The tool generates configuration files for multiple platforms:

- Claude (Desktop/CLI via .mcp.json)
- Google Gemini (settings.json)
- Antigravity (mcp_config.json)
- Cursor (.cursor/mcp.json)
- Windsurf (mcp_config.json)
- GitHub Copilot (.vscode/mcp.json)
- Roo Code (.roo/mcp.json)
- Codex (.codex/config.toml)
- OpenCode (opencode.json)
- Kilocode (.kilocode/mcp.json)

## Configuration Wizard

The tool will guide you through the following steps:

1. **Enable Agent API**: Instructions on how to enable the Agent API in your WordPress dashboard.
2. **Generate API Key**: Guidance on generating a secure API Key within WordPress.
3. **Configure Credentials**:
    - **Agent API Endpoint**: Your WordPress site's API endpoint.
    - **Agent API Key**: The key generated in step 2.
    - **Agent API Email**: The email associated with the API key.
    - **Gemini API Key**: (Optional, if `--add-gemini-key` is used) Your Gemini API Key from Google AI Studio.
