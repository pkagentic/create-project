# @pkagentic/create-project

Scaffold and configure a PK Agentic project quickly and easily. This tool provides a step-by-step wizard to help you set up your project with the necessary Agent API credentials and configurations.

## Installation

You can run the scaffolder directly using `npx`:

```bash
npx @pkagentic/create-project@latest [project-directory]
```

### Parameters

- `project-directory` (Optional): The name of the directory where the project will be scaffolded. If not provided, it defaults to the current directory (`.`).

### Options

- `--add-gemini-key`: Include the Gemini API Key (AI Studio) configuration in the wizard.
- `-V, --version`: Output the version number.
- `-h, --help`: Display help for the command.

## Configuration Wizard

The tool will guide you through the following steps:

1. **Enable Agent API**: Instructions on how to enable the Agent API in your WordPress dashboard.
2. **Generate API Key**: Guidance on generating a secure API Key within WordPress.
3. **Configure Credentials**:
    - **Agent API Endpoint**: Your WordPress site's API endpoint.
    - **Agent API Key**: The key generated in step 2.
    - **Agent API Email**: The email associated with the API key.
    - **Gemini API Key**: (Optional, if `--add-gemini-key` is used) Your Gemini API Key from Google AI Studio.
