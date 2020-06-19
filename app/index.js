const fs = require('fs');
const os = require('os');
const fetch = require('node-fetch');
const chalk = require('chalk');
const unzipper = require('unzipper');
const Generator = require('yeoman-generator');

const { platforms, apps, removeDirectory, getLocalDirectory, confirmLocalInstallations, confirmExistingLocalAddons, enableAddon } = require('./utils');
const { ascii } = require('./ascii.js');

class LocalAddonGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('name', {
            required: false,
            type: String,
            desc: 'Directory/internal name for the new add-on'
        });
        this.argument('productname', {
            required: false,
            type: String,
            desc: 'Product/display name for the new add-on'
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
        this.existingAddons = new Map();
        
        this.addonBoilerplate = 'https://github.com/ethan309/clone-test/archive/master.zip';
        this.addonBoilerplateArchiveName = 'clone-test-master';

        this.addonProductName = this.options['productname'];
        this.addonDirectoryName = this.options['name'];

        this.preferLocalBeta = this.options['beta'];
        this.shouldPlaceAddonDirectly = this.options['place-directly'];
        this.shouldSymlinkAddon = !this.options['do-not-symlink'] && !this.shouldPlaceAddonDirectly;
        this.shouldEnableAddon = !this.options['disable'] && (this.shouldPlaceAddonDirectly || this.shouldSymlinkAddon);
    }

    // PRIVATE METHODS

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
        // check existing Local installations
        this.log('\n' + chalk.yellow('🔈 INFO: ') + 'Checking on your existing Local installations and add-ons...');
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
            this.existingAddons = confirmExistingLocalAddons(this.localApp);
        } catch(error) {
            this._warn('There was a problem identifying your existing Local add-ons.');
            this.existingAddons = new Set();
        }
        this._completion('Everything looks good! Let\'s start making that new add-on...');
    }

    async prompting() {
        this.log('\n' + chalk.cyan('🎤 PROMPTS: ') + 'We need a bit of information before we can create your add-on.');
        // get addon product name (if needed)
        if(this.addonProductName === undefined) {
            this.addonProductName = await this._promptUser({
                type: 'input',
                message: 'What is the name of your addon?',
                default: 'my-new-local-addon'
            });
        }
        // confirm product name availability
        while(this.existingAddons.has(this.addonProductName)) {
            this.addonProductName = await this._promptUser({
                type: 'input',
                message: 'An add-on with the provided name already exists. What is the name of your addon?',
                default: 'my-new-local-addon'
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
        while(Array.from(this.existingAddons.values()).includes(this.addonDirectoryName)) {
            this.addonDirectoryName = await this._promptUser({
                type: 'input',
                message: 'An add-on with the provided direectory name already exists. What is the name of your addon?',
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
        if(this.shouldPlaceAddonDirectly) {
            this.destinationRoot(getLocalDirectory(this.localApp) + '/addons');
        }

        try {
            // pull down boilerplate zip archive
            const boilerplate = await fetch(this.addonBoilerplate);
            await boilerplate.body.pipe(unzipper.Extract({ path: this.destinationRoot() })).promise();
        } catch(error) {
            this._error('There was a problem retrieving the Local add-on boilerplate archive.');
        }
        
        try {
            // rename addon folder
            fs.renameSync(this.destinationRoot() + '/' + this.addonBoilerplateArchiveName, this.destinationRoot() + '/' + this.addonDirectoryName);
        } catch(error) {
            // remove unpacked boilerplate archive
            removeDirectory(this.destinationRoot() + '/' + this.addonBoilerplateArchiveName);
            this._error('There was a problem setting up the Local add-on directory.');
        }

        this._completion('Success! Your Local add-on directory has been created.');
    }

    install() {
        this._info('Setting up your new add-on in the Local application...');
        // symlink new addon (if needed)
        if(this.shouldSymlinkAddon) {
            fs.symlinkSync(this.destinationRoot() + '/' + this.addonDirectoryName, getLocalDirectory(this.localApp) + '/addons/' + this.addonDirectoryName);
        }
        // enable addon (if needed)
        if(this.shouldEnableAddon) {
            this._info('Enabling your add-on...');
            enableAddon(this.localApp, this.addonDirectoryName);
        }
    }

    end() {
        // clean up as needed
        // confirm success/failure
        this._completion('Your ' + this.localApp + ' add-on has been created and set up successfully.');
        this._info('You can find the directory for your newly created add-on at ' + this.destinationRoot() + '/' + this.addonDirectoryName);
        // print next steps, links, etc
    }
}

module.exports = LocalAddonGenerator;