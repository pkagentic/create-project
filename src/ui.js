const chalk = require('chalk');

const showBanner = () => {
  console.log(chalk.cyan.bold('\n' + '━'.repeat(50)));
  console.log(chalk.cyan.bold('🚀 Welcome to PK Agentic Scaffolder!'));
  console.log(chalk.cyan.bold('━'.repeat(50) + '\n'));
};

const showStep = (number, title, description, details) => {
  console.log(chalk.white.bold(`\nSTEP ${number}: ${title}`));
  if (description) console.log(chalk.white(`  ${description}`));
  if (details) {
    details.forEach(detail => {
      console.log(chalk.yellow(`  ${detail}`));
    });
  }
};

const showInfo = (text) => console.log(chalk.gray(`  ${text}`));
const showSuccess = (text) => console.log(chalk.green.bold(`\n✅ ${text}`));
const showError = (text) => console.log(chalk.red.bold(`\n❌ ${text}`));
const showHeader = (text) => console.log(chalk.blue.bold(`\n--- ${text} ---`));

module.exports = {
  showBanner,
  showStep,
  showInfo,
  showSuccess,
  showError,
  showHeader
};
