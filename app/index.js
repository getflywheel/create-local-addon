const fs = require('fs');
const os = require('os');
const http = require('http');
const chalk = require('chalk');
const unzipper = require('unzipper');
const Generator = require('yeoman-generator');

const platforms = {
    macOS: 'darwin',
    windows: 'win32',
    linux: 'linux'
};

const apps = {
    local: 'Local',
    localBeta: 'Local Beta'
};

const removeDirectory = function(path) {
    if(!fs.existsSync(path))
        return;
    if(fs.lstatSync(path).isFile()) {
        fs.unlinkSync(path);
        return;
    }
    fs.readdirSync(path).forEach((member) => {
        if(fs.lstatSync(path + '/' + member).isDirectory()) {
            this._removeDirectory(path + '/' + member);
        } else {
            fs.unlinkSync(path + '/' + member);
        }
    });
    fs.rmdirSync(path);
};

class LocalAddonGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('addonName', {
            required: false,
            type: String,
            desc: 'name for the new add-on'
        });

        this.option('beta', {
            type: Boolean,
            desc: 'optional preference to install add-on for Local Beta'
        });
        this.option('disable'), {
            type: Boolean,
            desc: 'optional preference to skip enabling add-on'
        };

        this.localApp = 'Local';
        this.existingAddons = new Set();
        this.addonBoilerplate = 'https://github.com/ethan309/clone-test/archive/master.zip';
        this.addonBoilerplateArchiveName = 'clone-test-master'
        this.workingDirectory = this.destinationRoot();
    }

    // CONFIGURATION ACCESSOR METHODS

    __addonName() {
        return this.options.addonName ? this.options.addonName : this.configurations.addonName;
    }

    __shouldEnableAddon() {
        return !this.options.disable;
    }

    // PRIVATE METHODS

    _getLocalDirectory(localApp) {
        const platform = os.platform();
        if(platform === platforms.macOS) {
            return os.homedir() + '/Library/Application Support/' + localApp;
        }
    }

    _confirmLocalInstallations() {
        var localInstallations = [];
        if(fs.existsSync(this._getLocalDirectory(apps.local))) {
            localInstallations.push(apps.local);
        }
        if(fs.existsSync(this._getLocalDirectory(apps.localBeta))) {
            localInstallations.push(apps.localBeta);
        }
        return localInstallations;
    }

    _confirmExistingLocalAddons(localApp) {
        var existingAddons = [];
        try {
            fs.readdirSync(this._getLocalDirectory(localApp) + '/addons').forEach((addonName) => {
                if(!addonName.startsWith('.')) {
                    existingAddons.push(addonName);
                }
            });
        } catch(error) {
            this.log(chalk.red('🚨 WARNING: ') + 'There was a problem identifying your existing Local add-ons.');
            return new Set();
        }
        return new Set(existingAddons);
    }

    _enableAddon(localApp, addonName) {
        // ...
    }

    // ORDERED GENERATOR STEPS

    initializing() {
        // print greeting, instructions, etc
        const localInstallations = this._confirmLocalInstallations();
        if(this.options.beta && localInstallations.includes(apps.localBeta)) {
            this.localApp = apps.localBeta;
        } else if(localInstallations.includes(apps.local)) {
            this.localApp = apps.local;
        } else if(localInstallations.includes(apps.localBeta)) {
            this.localApp = apps.localBeta;
        } else {
            this.env.error(chalk.red('❌ ERROR: ') + 'No installations of Local found! Please install Local at https://localwp.com to create an add-on.');
        }
        // check existing Local add-ons
        this.existingAddons = this._confirmExistingLocalAddons(this.localApp);
    }

    async prompting() {
        // get addon name (if needed)
        if(this.options.addonName === undefined) {
            this.configurations = await this.prompt([
                {
                    type: 'input',
                    name: 'addonName',
                    message: 'What is the name of your addon?',
                    default: 'my-new-local-addon'
                }
            ]);
        }
        // confirm name availability
        while(this.existingAddons.has(this.__addonName())) {
            this.options.addonName = undefined;
            this.configurations = await this.prompt([
                {
                    type: 'input',
                    name: 'addonName',
                    message: 'An add-on with the provided name already exists. What is the name of your addon?',
                    default: 'my-new-local-addon'
                }
            ]);
        }
    }

    async writing() {
        try {
            // pull down boilerplate zip archive
            this.spawnCommandSync('curl', ['-L', '-o', 'boilerplate.zip', this.addonBoilerplate]); // swap out with HTTP GET request for better control, error handling
        } catch(error) {
            this.env.error(chalk.red('❌ ERROR: ') + 'There was a problem retrieving the Local add-on boilerplate archive.');
        }

        try {
            // unzip boilerplate archive
            await fs.createReadStream(this.workingDirectory + '/boilerplate.zip').pipe(unzipper.Extract({ path: this.workingDirectory })).promise();//.on('error', (error) => {
            //    this.env.error(error);
            //});
        } catch (error) {
            // remove boilerplate zip archive
            fs.unlinkSync(this.workingDirectory + '/boilerplate.zip');
            this.env.error(chalk.red('❌ ERROR: ') + 'There was a problem unpacking the Local add-on boilerplate archive.');
        }

        // remove boilerplate zip archive
        fs.unlinkSync(this.workingDirectory + '/boilerplate.zip');
        
        try {
            // rename addon folder
            fs.renameSync(this.workingDirectory + '/' + this.addonBoilerplateArchiveName, this.workingDirectory + '/' + this.__addonName());
        } catch(error) {
            // remove unpacked boilerplate archive
            removeDirectory(this.workingDirectory + '/' + this.addonBoilerplateArchiveName);
            this.env.error(chalk.red('❌ ERROR: ') + 'There was a problem setting up the Local add-on directory.');
        }

        this.log(chalk.red('✅ DONE: ') + 'Success! Your Local add-on directory has been created. Setting up in Local application...');
    }

    install() {
       // symlink new addon (if needed)
       // enable addon (if needed)
       this._enableAddon(this.localApp, this.__addonName());
    }

    end() {
        // clean up as needed
        // confirm success/failure
        // print next steps, links, etc
    }
}

module.exports = LocalAddonGenerator;