const axios = require('axios');
const https = require('https');
const ora = require('ora');
const chalk = require('chalk');

const validateCredentials = async (endpoint, key, email, skipSslVerify = false) => {
  const baseURL = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  const spinner = ora('Testing API connection...').start();
  
  try {
    const axiosConfig = {
      baseURL,
      headers: {
        "X-PK-Agent-Key": key,
        "X-PK-Agent-Email": email,
        "Content-Type": "application/json",
      },
    };

    if (skipSslVerify) {
      axiosConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const axiosInstance = axios.create(axiosConfig);

    const response = await axiosInstance.get('guide', {
      params: { guide: 'main' }
    });

    if (response.data && response.data.success === true) {
      spinner.succeed(chalk.green('API connection successful!'));
      return {
        success: true,
        data: response.data.data.data
      };
    } else {
      spinner.fail(chalk.red('API validation failed. Please check your credentials.'));
      console.log(chalk.red('Error response:'), response.data);
      return { success: false };
    }
  } catch (error) {
    spinner.fail(chalk.red('API connection failed.'));
    console.error(chalk.red(`  Error: ${error.message}`));
    return { success: false };
  }
};

module.exports = { validateCredentials };
