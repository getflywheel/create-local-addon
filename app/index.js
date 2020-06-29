const fs = require('fs-extra');
const jp = require('fs-jetpack');
const path = require('path');
const fetch = require('node-fetch');
const chalk = require('chalk');
const unzipper = require('unzipper');
const Generator = require('yeoman-generator');

const { apps, removeDirectory, getLocalDirectory, confirmLocalInstallations, confirmExistingLocalAddonDirectories, getDirectoryContents, confirmExistingLocalAddonNames, enableAddon } = require('./utils');
const { title, ascii } = require('./constants.js');

class LocalAddonGenerator extends Generator {
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
            desc: 'Print status updates during the setup process',
            default: false
        });
        this.option('show-error-traces', {
            type: Boolean,
            desc: 'Print full error messages on occurrence',
            default: false
        });

        this.localApp = 'Local';
        this.existingAddonNames = new Set();
        this.existingAddonDirectories = new Set();
        this.existingTargetDirectoryContents = new Set();
        
        this.addonBoilerplate = 'https://github.com/ethan309/clone-test/archive/master.zip';
        this.addonBoilerplateArchiveName = 'clone-test-master';

        this.addonProductName = this.options['productname'];
        this.addonDirectoryName = this.options['directoryname'];

        this.preferLocalBeta = this.options['beta'];
        this.shouldPlaceAddonDirectly = this.options['place-directly'];
        this.shouldSymlinkAddon = !this.options['do-not-symlink'] && !this.shouldPlaceAddonDirectly;
        this.shouldEnableAddon = !this.options['disable'] && (this.shouldPlaceAddonDirectly || this.shouldSymlinkAddon);
        this.shouldBeVerbose = this.options['verbose'];
        this.shouldShowFullErrors = this.options['show-error-traces'];

        this.targetDirectoryPath = this.destinationRoot();
    }

    // PRIVATE METHODS FOR USER INTERACTION

    async _promptUser(promptProperties) {
        promptProperties.name = 'userResponse';
        const response = await this.prompt(promptProperties);
        return response.userResponse;
    }

    _info(message) {
        if(this.shouldBeVerbose) {
            this.log('\n' + chalk.yellow('🔈 INFO: ') + message);
        }
    }

    _completion(message) {
        if(this.shouldBeVerbose) {
            this.log('\n' + chalk.green('✅ DONE: ') + message);
        }
    }

    _warn(message, error) {
        if(this.shouldShowFullErrors && error !== undefined) {
            this.log(error);
        }
        this.log('\n' + chalk.red('🚨 WARNING: ') + message);
    }

    _error(message, error) {
        if(this.shouldShowFullErrors && error !== undefined) {
            this.log(error);
        }
        this.env.error('\n' + chalk.red('❌ ERROR: ') + message);
    }

    _printFollowupInstructions(addonDirectory, alreadyBuilt) {
        this.log('\n');
        this.log(chalk.green.bold('NEXT STEPS'));
        if(!alreadyBuilt) {
            this.log(chalk.green('Installing and building your add-on\'s dependencies:'));
            this.log('If you wish to see your add-on displayed in Local and enable it, you must make sure to install/build your add-on\'s dependencies:');
            this.log('\n' + chalk.greenBright.bold('1. ') + 'Navigate to your add-on directory:\n');
            this.log('          ' + chalk.yellowBright('cd ' + addonDirectory));
            this.log('\n' + chalk.greenBright.bold('2. ') + 'Install add-on dependencies:\n');
            this.log('          ' + chalk.yellowBright('yarn'));
            this.log('\n' + chalk.greenBright.bold('3. ') + 'Run build script from package.json:\n');
            this.log('          ' + chalk.yellowBright('yarn build'));
            this.log('\n' + chalk.greenBright.bold('4. ') + 'Enable your add-on in the Local application.\n');
        }
        this.log(chalk.green('Making changes to your add-on:'));
        this.log(chalk.greenBright.bold('→ ') + 'You can change your add-on by making changes to the source files:\n');
        this.log('          ' + chalk.cyanBright(path.join(addonDirectory, 'src')));
        this.log('\n' + chalk.greenBright.bold('→ ') + 'Compile, watch add-on source files, and trigger recompilation on change:\n');
        this.log('          ' + chalk.yellowBright('cd ' + addonDirectory));
        this.log('          ' + chalk.yellowBright('yarn build --watch'));
        this.log('');
        this.log(chalk.green.bold('NEED SOME HELP?'));
        this.log(chalk.greenBright.bold('→ ') + 'Looking for resources to help you get started with your add-on? Visit ' + chalk.cyan.bold('https://localwp.com/get-involved'));
        this.log(chalk.greenBright.bold('→ ') + 'Thinking of submiting your add-on to the Local add-on marketplace? Visit ' + chalk.cyan.bold('https://localwp.com/submit-addon'));
        this.log('Okay, we\'ll get out of the way and let you start developing! If you have any questions or concerns, try consulting the documentation for Local add-on development.');
        this.log('');
    }

    // ORDERED GENERATOR STEPS

    initializing() {
        // print greeting, instructions, etc
        if(this.shouldBeVerbose) {
            this.log(ascii);
            this.log(title);
            this.log(chalk.bold('Hello! We are here today to create a new add-on for the Local application. Yay!'));
            this.log('We are planning to pull down a basic add-on –– just a little something to act as a starting point for your add-on development.');
            this.log('Then we\'ll do some basic setup: put your files where you want them, make sure Local knows about your add-on, and get you up and running as soon as possible!');
            this.log('While we work on getting your add-on ready, we\'ll keep you updated on our progress. You can customize the setup a bit if you want! Run ' + chalk.yellowBright('yo create-local-addon --help') + ' to learn more.');
            this.log('');
            this.log(chalk.bold('Okay, let\'s get started!'));
        }
        
        this._info('Checking on your existing Local installations and add-ons...');

        // check existing Local installations
        const localInstallations = confirmLocalInstallations();
        if(this.preferLocalBeta && localInstallations.has(apps.localBeta)) {
            this.localApp = apps.localBeta;
        } else if(localInstallations.has(apps.local)) {
            this.localApp = apps.local;
        } else if(localInstallations.has(apps.localBeta)) {
            this.localApp = apps.localBeta;
        } else {
            this._error(
                'No installations of Local found! Please install Local at https://localwp.com before you create an add-on.',
                'No Local directory found: ' + chalk.cyanBright(getLocalDirectory(apps.local))
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
            this.log('\n' + chalk.cyan('🎤 PROMPTS: ') + 'We need a bit of information before we can create your add-on.');
        }

        // get addon product name (if needed)
        if(this.addonProductName === undefined) {
            this.addonProductName = await this._promptUser({
                type: 'input',
                message: 'What is the name of your addon? This will be shown to users.',
                default: 'My New Local Addon'
            });
        }

        // get addon directory name (if needed)
        if(this.addonDirectoryName === undefined) {
            this.addonDirectoryName = await this._promptUser({
                type: 'input',
                message: 'We would like to make a directory for your add-on. What would you like to name this directory?',
                default: this.addonProductName.toLowerCase().replace(/\s+/g, '-')
            });
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
        }
    }

    async writing() {
        this._info('Pulling down the boilerplate Local add-on to set up...');

        // if symlink flag is not used, create add-on directly in Local add-ons directory
        this.targetDirectoryPath = this.shouldPlaceAddonDirectly ? getLocalDirectory(this.localApp) + '/addons' : this.destinationRoot();

        try {
            // pull down and unpack boilerplate zip archive
            const boilerplate = await fetch(this.addonBoilerplate);
            await boilerplate.body.pipe(unzipper.Extract({ path: this.targetDirectoryPath })).promise();
        } catch(error) {
            this._error('There was a problem retrieving the Local add-on boilerplate archive.', error);
        }
        
        try {
            // rename addon folder
            fs.renameSync(
                path.join(this.targetDirectoryPath, this.addonBoilerplateArchiveName),
                path.join(this.targetDirectoryPath, this.addonDirectoryName)
            );
        } catch(error) {
            // remove unpacked boilerplate archive
            removeDirectory(path.join(this.targetDirectoryPath, this.addonBoilerplateArchiveName));
            this._error('There was a problem setting up the Local add-on directory.', error);
        }

        this._completion('Success! Your Local add-on directory has been created.');
        this._info('Initializing your add-on with your information...');
        
        const packageJSONPath = path.join(this.targetDirectoryPath, this.addonDirectoryName, 'package.json');
        const packageJSON = fs.readJsonSync(packageJSONPath);
        packageJSON['name'] = this.addonDirectoryName;
        packageJSON['productName'] = this.addonProductName;
        fs.writeJsonSync(packageJSONPath, packageJSON);

        this._completion('Looking good! Your Local add-on is configured.');
    }

    install() {
        this._info('Setting up your new add-on in the Local application...');

        // symlink new addon (if needed)
        if(this.shouldSymlinkAddon) {
            try {
                fs.symlinkSync(
                    path.join(this.targetDirectoryPath, this.addonDirectoryName),
                    path.join(getLocalDirectory(this.localApp), 'addons', this.addonDirectoryName)
                );
            } catch(error) {
                this._error('There was a problem linking your add-on into the Local add-ons directory. The add-on has been created, but may not appear in the Local application.', error);
            }
        }

        // enable addon (if needed)
        if(this.shouldEnableAddon) {
            this._info('Building dependencies for your add-on...');
            const addonDirectoryPath = path.join(this.targetDirectoryPath, this.addonDirectoryName);
            this.destinationRoot(addonDirectoryPath);
            this.spawnCommandSync('yarn');
            this.spawnCommandSync('yarn', ['build']);
            this._info('Enabling your add-on...');
            enableAddon(this.localApp, this.addonDirectoryName);
        }
    }

    end() {
        // clean up as needed
        // confirm success/failure
        this._completion('Your ' + this.localApp + ' add-on has been created and set up successfully.');
        const addonDirectoryPath = path.join(this.targetDirectoryPath, this.addonDirectoryName);
        this._info('You can find the directory for your newly created add-on at ' + chalk.cyanBright(addonDirectoryPath));
        // print next steps, links, etc
        this._printFollowupInstructions(addonDirectoryPath, this.shouldEnableAddon);
    }
}

module.exports = LocalAddonGenerator;