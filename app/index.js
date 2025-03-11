import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';
import gunzip from 'gunzip-maybe';
import tar from 'tar-fs';
import outdent from 'outdent';
import Generator from 'yeoman-generator';
import Insight from 'insight';

import {
    apps,
    platforms,
    getLocalDirectory,
    confirmLocalInstallations,
    confirmExistingLocalAddonDirectories,
    getDirectoryContents,
    confirmExistingLocalAddonNames,
    enableAddon
} from './utils.js';

import {
    formatLink,
    formatPath,
    formatCommand,
    formatCommandBlock,
    formatSectionHeader,
    formatSectionSubheader,
    formatLeadIn
} from './styles.js';

import { help, title, ascii } from './constants.js';

import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

export default class LocalAddonGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('productname', {
            required: false,
            type: String,
            desc: 'Product/display name for the new add-on'
        });
        this.argument('directoryname', {
            required: false,
            type: String,
            desc: 'Directory/internal name for the new add-on'
        });

        this.option('help', {
            type: Boolean,
            desc: 'Print the generator\'s options and usage',
            default: false
        });
        this.option('beta', {
            type: Boolean,
            desc: 'Preference to install add-on for Local Beta',
            default: false
        });
        this.option('place-directly', {
            type: Boolean,
            desc: 'Place add-on directory directly into Local add-ons directory (automatically adds --do-not-symlink)',
            default: false
        });
        this.option('do-not-symlink', {
            type: Boolean,
            desc: 'Skip creating a symbolic link in Local add-ons directory to your add-on directory',
            default: false
        });
        this.option('disable', {
            type: Boolean,
            desc: 'Skip building and enabling add-on',
            default: false
        });
        this.option('verbose', {
            type: Boolean,
            desc: 'Print more detailed information and status updates during the setup process',
            default: false
        });
        this.option('show-error-traces', {
            type: Boolean,
            desc: 'Print full error messages on occurrence',
            default: false
        });

        // check for help flag before starting
        if(this.options['help']) {
            this.log(help);
            process.exit(0);  // exit early with no error
        }

        // ANALYTICS: insight with Google Analytics
        this.insight = new Insight({
            trackingCode: 'UA-174676965-1',
            pkg
        });

        // local/system information (will be updated during installation)
        this.localApp = 'Local';
        this.existingAddonNames = new Set();
        this.existingAddonDirectories = new Set();
        this.existingTargetDirectoryContents = new Set();
        
        // boilerplate add-on information
        this.addonBoilerplate = 'https://github.com/getflywheel/local-addon-boilerplate/archive/master.tar.gz';
        this.addonBoilerplateArchiveName = 'local-addon-boilerplate-master';

        // add-on public and internal names
        this.addonProductName = this.options['productname'];
        this.addonDirectoryName = this.options['directoryname'] !== undefined ? this._formatDirectoryName(this.options['directoryname']) : undefined;

        // setup preferences
        this.preferLocalBeta = this.options['beta'];
        this.shouldPlaceAddonDirectly = this.options['place-directly'];
        this.shouldSymlinkAddon = !this.options['do-not-symlink'] && !this.shouldPlaceAddonDirectly;
        this.shouldEnableAddon = !this.options['disable'] && (this.shouldPlaceAddonDirectly || this.shouldSymlinkAddon);
        this.shouldBeVerbose = this.options['verbose'];
        this.shouldShowFullErrors = this.options['show-error-traces'];

        this.flags = [
            ...(this.options['beta'] ? ['beta'] : []),
            ...(this.options['place-directly'] ? ['place directly'] : []),
            ...(this.options['do-not-symlink'] ? ['do not symlink'] : []),
            ...(this.options['disable'] ? ['disable'] : []),
            ...(this.options['verbose'] ? ['verbose'] : []),
            ...(this.options['show-error-traces'] ? ['show error traces'] : []),
        ];

        // add-on installation target path
        this.targetDirectoryPath = this.destinationRoot();
    }
    
    /**
     * Report event for analytics tracking.  
     * 
     * @param {string} eventAction - type of interaction (example: 'startup'), required
     * @param {string} eventLabel - event classifier or information (example: 'error' or 'CLI flags: --verbose --beta')
     * @param {integer} eventValue
     */
    _report(eventAction, eventLabel, eventValue) {
        if(eventAction === undefined) {
            return;
        }

        // Automatically rejects event and does not track if user has opted out.
        this.insight.trackEvent({
            category: 'LocalAddonGenerator',
            action: eventAction,
            label: eventLabel ? eventLabel : '',
            value: eventValue
        });
        // this.insight.track(eventAction, eventLabel, `${eventValue}`);
    }

    // PRIVATE FUNCTIONS FOR USER INTERACTION

    /**
     * _promptUser() prompts a user and returns their response.
     * 
     * @param {Object} promptProperties 
     * possible properties:
     *     - type (string): input type (input, confirm, etc)
     *     - message (string): prompt text shown to users
     *     - default (string): default response
     */
    async _promptUser(promptProperties) {
        promptProperties.name = 'userResponse';
        const response = await this.prompt(promptProperties);
        return response.userResponse;
    }

    _info(message) {
        if(this.shouldBeVerbose) {
            this.log(`\n🔈 ${chalk.magenta('INFO:')} ${message}`);
        }
    }

    _completion(message) {
        if(this.shouldBeVerbose) {
            this.log(`\n✅ ${chalk.green.bold('DONE:')} ${message}`);
        }
    }

    /**
     * _warn() reports a non-fatal error to the user.
     * 
     * @param {string} message 
     * @param {*} error 
     */
    _warn(message, error) {
        if(this.shouldShowFullErrors && error !== undefined) {
            this.log(error);
        }
        this.log(`\n🚨 ${chalk.red('WARNING:')} ${message}`);
    }

    /**
     * _error() reports a fatal error to the user and ends execution.
     * 
     * @param {string} message 
     * @param {*} error 
     */
    _error(message, error) {
        const raw = chalk.reset(message);

        // ANALYTICS: report error.
        this._report(
            'error',
            message
        );

        if(this.shouldShowFullErrors && error !== undefined) {
            this.log(error);
        }
        this.log(`\n❌ ${chalk.red('ERROR:')} ${message}`);
        this.env.error(`create-local-addon error: ${raw}`);
    }

    _formatDirectoryName(addonDirectoryName) {
        const formattedAddonName = addonDirectoryName.replace(/\s+/g, '-');
        if(formattedAddonName !== addonDirectoryName) {
            this._warn(`The entered directory name ${addonDirectoryName} contains spaces (not allowed). These invalid characters have been replaced with dashes.`);
        }
        return formattedAddonName;
    }

    _printOpeningInstructions() {
        this.log(outdent`\n
            ${chalk.bold('Hello! We are here today to create a new add-on for the Local application. Yay!')}
            We are planning to pull down a basic add-on –– just a little something to act as a starting point for your add-on development.
            Then we\'ll do some basic setup: put your files where you want them, make sure Local knows about your add-on, and get you up and running as soon as possible!
            ${this.shouldBeVerbose ? 'While we work on getting your add-on ready, we\'ll keep you updated on our progress. ' : ''}You can customize the setup a bit if you want! Run ${formatCommand('create-local-addon --help')} to learn more.
            
            ${chalk.bold('Okay, let\'s get started!')}
        `);
    }

    _printFollowupInstructions() {
        const addonDirectoryPath = path.join(this.targetDirectoryPath, this.addonDirectoryName);
        this.log('\n' + formatSectionHeader('NEXT STEPS'));
        if(!this.shouldEnableAddon) {
            this.log(outdent`
                ${formatSectionSubheader('Installing and building your add-on\'s dependencies:')}
                If you wish to see your add-on displayed in Local and enable it, you must make sure to install/build your add-on\'s dependencies:

                ${formatLeadIn('1. ')} Navigate to your add-on directory:

                        ${formatCommand('cd ' + addonDirectoryPath)}

                ${formatLeadIn('2. ')} Install add-on dependencies:

                        ${formatCommand('npm install')}

                ${formatLeadIn('3. ')} Run build script from package.json:

                        ${formatCommand('npm run build')}

                ${formatLeadIn('4. ')} Enable your add-on in the Local application (you will need to restart Local first if it is already running).

            `);
        } else {
            this.log('\nIf Local is already running, you will need to restart the application in order for your add-on to appear.\n');
        }
        this.log(formatSectionSubheader('Making changes to your add-on:'));
        if(this.shouldSymlinkAddon) {
            const addonSymlinkPath = path.join(getLocalDirectory(this.localApp), 'addons', this.addonDirectoryName);
            this.log(outdent`
                ${formatLeadIn('→ ')} A symlink pointing to your add-on directory has been made in the Local add-ons directory:

                        ${formatPath(addonSymlinkPath)}
                        
            `);
        }
        this.log(outdent`
            ${formatLeadIn('→ ')} You can change your add-on by making changes to the source files:

                    ${formatPath(path.join(addonDirectoryPath, 'src'))}

            ${chalk.dim('(' + formatPath('Boilerplate.jsx') + ' and ' + formatPath('renderer.jsx') + ' will have some basic logic in them to give you a starting point, but you\'ll probably want to make some changes.)')}

            ${formatLeadIn('→ ')} Compile, watch add-on source files, and trigger recompilation on change:
                    ${formatCommandBlock(['cd ' + addonDirectoryPath, 'npm run build --watch'], 1)}

            ${chalk.dim('(You can leave the ' + formatCommand('--watch') + ' flag off if you just want to compile your changes once.)')}

            ${formatSectionHeader('NEED SOME HELP?')}
            ${formatLeadIn('→ ')} Looking for resources to help you get started with your add-on? Visit ${formatLink('https://localwp.com/get-involved')}
            ${formatLeadIn('→ ')} Thinking of submiting your add-on to the Local add-on marketplace? Visit ${formatLink('https://localwp.com/submit-addon')}
            Okay, we\'ll get out of the way and let you start developing! If you have any questions or concerns, try consulting the documentation for Local add-on development.
    
        `);
    }

    /**
     * ORDERED GENERATOR STEPS
     * 
     * The generator will always run the following functions in the same order (regardless of their placement).
     * See https://yeoman.io/authoring/running-context.html for more info.
     */

    async initializing() {
        // print greeting, instructions, etc
        if(this.shouldBeVerbose) {
            this.log(ascii);
            this.log(title);
        }

        // ANALYTICS: prompt for permissions.
        if (this.insight.optOut === undefined) {
            await new Promise((resolve, reject) => {
                this.insight.askPermission(
                    `May ${chalk.cyan('Local Add-on Creator')} anonymously report usage statistics to improve our tool over time? We will not collect any personal information about you or your add-on — only the way you use this tool.`,
                    resolve
                );
            });
        }

        // ANALYTICS: report invocation with provided flags. Could give insight into if a certain default is always being overwritten or flag being used.
        this._report(
            'initialization',
            `${this.flags.join(', ')}`
        );

        this._printOpeningInstructions();

        // ANALYTICS: report system info. Could give insight into users (Example: Windows dominant user base?)
        this._report('system check', `${os.platform()}`)
        
        this._info('Checking on your existing Local installations and add-ons...');

        // check existing Local installations
        const localInstallations = confirmLocalInstallations();
        if(localInstallations.size == 2) {  // both applications installed
            this.localApp = this.preferLocalBeta ? apps.localBeta : apps.local;
        } else if(localInstallations.size == 1) {  // only Local or Local Beta installed
            this.localApp = localInstallations.has(apps.local) ? apps.local : apps.localBeta;
        } else {
            this._error(
                'No installations of Local found! Please install Local at https://localwp.com before you create an add-on.',
                'No Local directory found: ' + formatPath(getLocalDirectory(apps.local))
            );
        }

        // check where generator was invoked
        const localAddonsPath = path.join(getLocalDirectory(this.localApp), 'addons');
        if(this.targetDirectoryPath === localAddonsPath) {
            this._info('You seem to be running this generator within the ' + this.localApp + ' add-ons directory. As a result, add-on setup may differ from your selected preferences.');
            this.shouldPlaceAddonDirectly = true;
            this.shouldSymlinkAddon = false;
        }

        // check existing Local add-ons
        try {
            this.existingAddonNames = confirmExistingLocalAddonNames(this.localApp);
            this.existingAddonDirectories = confirmExistingLocalAddonDirectories(this.localApp);
            if(!this.shouldPlaceAddonDirectly) {
                this.existingTargetDirectoryContents = getDirectoryContents(this.targetDirectoryPath);
            }
        } catch(error) {
            this._warn('There was a problem identifying your existing Local add-ons.', error);
            this.existingAddonNames = new Set();
            this.existingAddonDirectories = new Set();
        }

        this._completion('Everything looks good! Let\'s start making that new add-on...');
    }

    async prompting() {
        if(this.shouldBeVerbose && (this.addonProductName === undefined || this.addonDirectoryName === undefined)) {
            this.log(`\n🎤 ${chalk.blue('PROMPTS:')} We need a bit of information before we can create your add-on.`);
        }

        // get addon product name (if needed)
        if(this.addonProductName === undefined || this.addonProductName.length === 0) {
            this.addonProductName = await this._promptUser({
                type: 'input',
                message: 'What is the name of your addon? This will be shown to users.',
                default: 'My New Local Addon'
            });
        }

        // get addon directory name (if needed)
        if(this.addonDirectoryName === undefined || this.addonDirectoryName.length === 0) {
            this.addonDirectoryName = await this._promptUser({
                type: 'input',
                message: 'We would like to make a directory for your add-on. What would you like to name this directory?',
                default: this.addonProductName.toLowerCase().replace(/\s+/g, '-')
            });
            this.addonDirectoryName = this._formatDirectoryName(this.addonDirectoryName);
        }
        
        // confirm directory name availability
        while(
            this.existingAddonNames.has(this.addonDirectoryName)
            || this.existingAddonDirectories.has(this.addonDirectoryName)
            || this.existingTargetDirectoryContents.has(this.addonDirectoryName)
        ) {
            this.addonDirectoryName = await this._promptUser({
                type: 'input',
                message: 'An add-on or directory with the name ' + this.addonDirectoryName + ' already exists. Please choose another.',
                default: this.addonProductName.toLowerCase().replace(/\s+/g, '-')
            });
            this.addonDirectoryName = this._formatDirectoryName(this.addonDirectoryName);
        }
    }

    async writing() {
        this._info('Pulling down the boilerplate Local add-on to set up...');

        // if symlink flag is not used, create add-on directly in Local add-ons directory
        this.targetDirectoryPath = this.shouldPlaceAddonDirectly ? path.join(getLocalDirectory(this.localApp), 'addons') : this.destinationRoot();
        this.destinationRoot(this.targetDirectoryPath);

        try {
            // pull down and unpack boilerplate zip archive
            const boilerplate = await fetch(this.addonBoilerplate);
            const archiveName = this.addonBoilerplateArchiveName;
            const newAddonDirectoryName = this.addonDirectoryName;
            await new Promise(function(resolve, reject) {
                boilerplate.body
                    .pipe(gunzip())
                    .pipe(tar.extract(`./${newAddonDirectoryName}`, {
                        map: (originalHeader) => {
                            const header = { ...originalHeader };
                            const expression = new RegExp(`${archiveName}/`,);

                            if (header.name.indexOf(`${archiveName}/`) === 0) {
                                header.name = header.name.replace(expression, '');
                            }

                            return header;
                        }
                    }))
                    .on('error', reject)
                    .on('finish', resolve);
            });
        } catch(error) {
            this._error('There was a problem retrieving the Local add-on boilerplate archive.', error);
        }

        this._completion('Success! Your Local add-on directory has been created.');
        this._info('Initializing your add-on with your information...');
        
        try {
            const packageJSONPath = path.join(this.targetDirectoryPath, this.addonDirectoryName, 'package.json');
            const packageJSON = fs.readJsonSync(packageJSONPath);
            packageJSON['name'] = this.addonDirectoryName;
            packageJSON['slug'] = this.addonDirectoryName;
            packageJSON['productName'] = this.addonProductName;
            fs.writeJsonSync(packageJSONPath, packageJSON, { spaces: 2 });
        } catch(error) {
            this._error(
                'There was a problem setting up your add-on with the information you provided. This can happen when there is a mismatch between the boilerplate add-on we pull down and what the generator expects; make sure you have the most up-to-date version of this generator and try again.',
                error
            );
        }

        this._completion('Looking good! Your Local add-on is configured.');
    }

    install() {
        this._info('Setting up your new add-on in the Local application...');
        var symlinkFailure = false;

        // symlink new addon (if needed)
        if(this.shouldSymlinkAddon) {
            try {
                fs.symlinkSync(
                    path.join(this.targetDirectoryPath, this.addonDirectoryName),
                    path.join(getLocalDirectory(this.localApp), 'addons', this.addonDirectoryName)
                );
            } catch(error) {
                symlinkFailure = true;

                if(os.platform() === platforms.windows) { // Windows system symlink failure
                    this._warn(
                        `We will not be able to create a symlink pointing to your add-on within the Local add-ons directory; this can happen when you are using a Windows system that does not support symlinks or the add-on generator has insufficient permissions to create a symlink. We will skip this linking step. See https://github.com/getflywheel/create-local-addon#for-our-windows-users for more information.\n`,
                        error
                    );
                } else { // Non-Windows system symlink failure
                    this.log(`New add-on directory: ${path.join(this.targetDirectoryPath, this.addonDirectoryName)}`);
                    this._error(
                        `There was a problem linking your add-on into the Local add-ons directory. The add-on has been created, but may not appear in the Local application until you link and build it yourself. See https://github.com/getflywheel/create-local-addon#buildingenabling-your-add-on-manually for more information.`,
                        error
                    );
                }
            }
        }

        // enable addon (if needed)
        if(this.shouldEnableAddon && !symlinkFailure) {
            this._info('Building dependencies for your add-on...');

            const previousDirectoryPath = this.destinationRoot();
            const addonDirectoryPath = path.join(this.targetDirectoryPath, this.addonDirectoryName);
            this.destinationRoot(addonDirectoryPath);

            try {
                const installer = 'npm'; // or 'yarn'
                this.spawnCommandSync(installer, ['install', '--quiet']); // use ['install', '--silent', '--ignore-engines'] if using yarn
                this.spawnCommandSync(installer, ['run', 'build']);
            } catch(error) {
                this._warn(
                    'A problem occurred while installing dependencies and building your add-on. Your add-on was still set up successfully, but may not appear within the Local application until you build it yourself. See https://github.com/getflywheel/create-local-addon#buildingenabling-your-add-on-manually for more information.',
                    error
                );
            }

            this.destinationRoot(previousDirectoryPath);
            
            this._info('Enabling your add-on...');
            enableAddon(this.localApp, this.addonDirectoryName);
        }
    }

    end() {
        // clean up as needed
        // confirm success/failure
        this._completion('Your ' + this.localApp + ' add-on has been created and set up successfully.');
        // print next steps, links, etc
        this._printFollowupInstructions();
        // ANALYTICS: report success/failure.
        this._report('success');
    }
}
