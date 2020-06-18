const fs = require('fs');
const os = require('os');
const http = require('http');
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
            desc: 'Name for the new add-on'
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
        this.existingAddons = new Set();
        
        this.addonBoilerplate = 'https://github.com/ethan309/clone-test/archive/master.zip';
        this.addonBoilerplateArchiveName = 'clone-test-master';

        this.addonName = this.options['name'];

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
            this.env.error('\n' + chalk.red('❌ ERROR: ') + 'No installations of Local found! Please install Local at https://localwp.com to create an add-on.');
        }
        // check existing Local add-ons
        try {
            this.existingAddons = confirmExistingLocalAddons(this.localApp);
        } catch(error) {
            this.log('\n' + chalk.red('🚨 WARNING: ') + 'There was a problem identifying your existing Local add-ons.');
            this.existingAddons = new Set();
        }
        this.log('\n' + chalk.green('✅ DONE: ') + 'Everything looks good! Let\'s start making that new add-on...');
    }

    async prompting() {
        this.log('\n' + chalk.cyan('🎤 PROMPTS: ') + 'We need a bit of information before we can create your add-on.');
        // get addon name (if needed)
        if(this.addonName === undefined) {
            this.addonName = await this._promptUser({
                type: 'input',
                message: 'What is the name of your addon?',
                default: 'my-new-local-addon'
            });
        }
        // confirm name availability
        while(this.existingAddons.has(this.addonName)) {
            this.addonName = await this._promptUser({
                type: 'input',
                message: 'An add-on with the provided name already exists. What is the name of your addon?',
                default: 'my-new-local-addon'
            });
        }

        // Coud prompt here for:
        //  - this.shouldEnableAddon
        //  - this.shouldSymlinkAddon
    }

    async writing() {
        this.log('\n' + chalk.yellow('🔈 INFO: ') + 'Pulling down the boilerplate Local add-on to set up...');
        // if symlink flag is not used, create add-on directly in Local add-ons directory
        if(this.shouldPlaceAddonDirectly) {
            this.destinationRoot(getLocalDirectory(this.localApp) + '/addons');
        }

        try {
            // pull down boilerplate zip archive
            this.spawnCommandSync('curl', ['-L', '-o', 'boilerplate.zip', this.addonBoilerplate]); // swap out with HTTP GET request for better control, error handling
        } catch(error) {
            this.env.error('\n' + chalk.red('❌ ERROR: ') + 'There was a problem retrieving the Local add-on boilerplate archive.');
        }

        const readStream = fs.createReadStream(this.destinationRoot() + '/boilerplate.zip')
            .on('error', (error) => {
                // remove boilerplate zip archive
                fs.unlinkSync(this.destinationRoot() + '/boilerplate.zip');
                this.env.error('\n' + chalk.red('❌ ERROR: ') + 'There was a problem locating the Local add-on boilerplate archive to be unpacked.');
            });

        try {
            // unzip boilerplate archive
            await readStream.pipe(unzipper.Extract({ path: this.destinationRoot() })).promise();
        } catch (error) {
            // remove boilerplate zip archive
            fs.unlinkSync(this.destinationRoot() + '/boilerplate.zip');
            this.env.error('\n' + chalk.red('❌ ERROR: ') + 'There was a problem unpacking the Local add-on boilerplate archive.');
        }

        // remove boilerplate zip archive
        fs.unlinkSync(this.destinationRoot() + '/boilerplate.zip');
        
        try {
            // rename addon folder
            fs.renameSync(this.destinationRoot() + '/' + this.addonBoilerplateArchiveName, this.destinationRoot() + '/' + this.addonName);
        } catch(error) {
            // remove unpacked boilerplate archive
            removeDirectory(this.destinationRoot() + '/' + this.addonBoilerplateArchiveName);
            this.env.error('\n' + chalk.red('❌ ERROR: ') + 'There was a problem setting up the Local add-on directory.');
        }

        this.log('\n' + chalk.green('✅ DONE: ') + 'Success! Your Local add-on directory has been created.');
    }

    install() {
        this.log('\n' + chalk.yellow('🔈 INFO: ') + 'Setting up your new add-on in the Local application...');
        // symlink new addon (if needed)
        if(this.shouldSymlinkAddon) {
            fs.symlinkSync(this.destinationRoot() + '/' + this.addonName, getLocalDirectory(this.localApp) + '/addons/' + this.addonName);
        }
        // enable addon (if needed)
        if(this.shouldEnableAddon) {
            this.log('\n' + chalk.yellow('🔈 INFO: ') + 'Enabling your add-on...');
            enableAddon(this.localApp, this.addonName);
        }
    }

    end() {
        // clean up as needed
        // confirm success/failure
        this.log('\n' + chalk.green('✅ DONE: ') + 'Your ' + this.localApp + ' add-on has been created and set up successfully.');
        this.log('\n' + chalk.yellow('🔈 INFO: ') + 'You can find the directory for your newly created add-on at ' + this.destinationRoot() + '/' + this.addonName);
        // print next steps, links, etc
    }
}

module.exports = LocalAddonGenerator;