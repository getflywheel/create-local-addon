const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const chalk = require('chalk');
const unzipper = require('unzipper');
const Generator = require('yeoman-generator');

const { apps, removeDirectory, getLocalDirectory, confirmLocalInstallations, confirmExistingLocalAddonDirectories, confirmExistingLocalAddonNames, enableAddon } = require('./utils');
const { ascii } = require('./ascii.js');

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
            desc: 'Skip enabling add-on',
            default: false
        });

        this.localApp = 'Local';
        this.existingAddonNames = new Set();
        this.existingAddonDirectories = new Set();
        
        this.addonBoilerplate = 'https://github.com/ethan309/clone-test/archive/master.zip';
        this.addonBoilerplateArchiveName = 'clone-test-master';

        this.addonProductName = this.options['productname'];
        this.addonDirectoryName = this.options['directoryname'];

        this.preferLocalBeta = this.options['beta'];
        this.shouldPlaceAddonDirectly = this.options['place-directly'];
        this.shouldSymlinkAddon = !this.options['do-not-symlink'] && !this.shouldPlaceAddonDirectly;
        this.shouldEnableAddon = !this.options['disable'] && (this.shouldPlaceAddonDirectly || this.shouldSymlinkAddon);

        this.targetDirectoryPath = this.destinationRoot();
    }

    // PRIVATE METHODS FOR USER INTERACTION

    async _promptUser(promptProperties) {
        promptProperties.name = 'userResponse';
        const response = await this.prompt(promptProperties);
        return response.userResponse;
    }

    _info(message) {
        this.log('\n' + chalk.yellow('🔈 INFO: ') + message);
    }

    _completion(message) {
        this.log('\n' + chalk.green('✅ DONE: ') + message);
    }

    _warn(message) {
        this.log('\n' + chalk.red('🚨 WARNING: ') + message);
    }

    _error(message) {
        this.env.error('\n' + chalk.red('❌ ERROR: ') + message);
    }

    // ORDERED GENERATOR STEPS

    initializing() {
        // print greeting, instructions, etc
        this.log(ascii);
        this.log(chalk.bgGreen.white.bold('                                LOCAL ADDON CREATOR                                \n'));
        this.log(chalk.bold('** Instructions here... **'));
        
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
            this._error('No installations of Local found! Please install Local at https://localwp.com to create an add-on.');
        }

        // check existing Local add-ons
        try {
            this.existingAddonNames = confirmExistingLocalAddonNames(this.localApp);
            this.existingAddonDirectories = confirmExistingLocalAddonDirectories(this.localApp);
        } catch(error) {
            this._warn('There was a problem identifying your existing Local add-ons.');
            this.existingAddonNames = new Set();
            this.existingAddonDirectories = new Set();
        }

        this._completion('Everything looks good! Let\'s start making that new add-on...');
    }

    async prompting() {
        if(this.addonProductName === undefined || this.addonDirectoryName === undefined) {
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
        while(this.existingAddonNames.has(this.addonDirectoryName) || this.existingAddonDirectories.has(this.addonDirectoryName)) {
            this.addonDirectoryName = await this._promptUser({
                type: 'input',
                message: 'An add-on with the name or directory ' + this.addonDirectoryName + ' already exists. Please choose another.',
                default: this.addonProductName.toLowerCase().replace(/\s+/g, '-')
            });
        }

        // Could prompt here for:
        //  - this.shouldEnableAddon
        //  - this.shouldSymlinkAddon
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
            this._error('There was a problem retrieving the Local add-on boilerplate archive.');
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
            this._error('There was a problem setting up the Local add-on directory.');
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
            fs.symlinkSync(
                path.join(this.targetDirectoryPath, this.addonDirectoryName),
                path.join(getLocalDirectory(this.localApp), 'addons', this.addonDirectoryName)
            );
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
        this._info('You can find the directory for your newly created add-on at ' + addonDirectoryPath);
        // print next steps, links, etc
    }
}

module.exports = LocalAddonGenerator;