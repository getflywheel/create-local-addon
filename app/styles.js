
import chalk from 'chalk';
import outdent from 'outdent';

export const formatLink = chalk.blue.bold;
export const formatPath = chalk.blueBright;
export const formatCommand = (command) => chalk.bgBlackBright.yellowBright(` ${command} `);
export const formatCommandBlock = (commands, tabs) => {
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

export const formatSectionHeader = chalk.green.bold;
export const formatSectionSubheader = chalk.green;
export const formatLeadIn = chalk.greenBright.bold;
