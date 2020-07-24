const chalk = require('chalk');

const formatLink = chalk.blue.bold;
const formatPath = chalk.blueBright;
const formatCommand = (command) => chalk.bgBlackBright.yellowBright(` ${command} `);
const formatCommandBlock = (commands, tabs) => {
    var lineLength = commands.reduce((longest, command) => Math.max(longest, command.length), 0) + 1;
    const lineTabs = '\t'.repeat(tabs);
    const block = commands.reduce((codeBlock, command) => {
        return outdent`
            ${codeBlock}
            ${lineTabs + chalk.bgBlackBright.yellowBright(' ' + command.padEnd(lineLength))}
        `;
    }, '');
    return block;
};

const formatSectionHeader = chalk.green.bold;
const formatSectionSubheader = chalk.green;
const formatLeadIn = chalk.greenBright.bold;

module.exports = {
    formatLink,
    formatPath,
    formatCommand,
    formatCommandBlock,
    formatSectionHeader,
    formatSectionSubheader,
    formatLeadIn
};