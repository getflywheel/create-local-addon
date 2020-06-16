const fs = require('fs');
const os = require('os');
const chalk = require('chalk');
const Generator = require('yeoman-generator');

const apps = {
    local: 'Local',
    localBeta: 'Local Beta'
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
            desc: 'optioanl preference to install add-on for Local Beta'
        });
        this.option('disable'), {
            type: Boolean,
            desc: 'optional preference to skip enabling add-on'
        };

        this.localApp = 'Local';
    }

    // CONFIGURATION ACCESSOR METHODS

    __addonName() {
        return this.options.addonName ? this.options.addonName : this.configurations.addonName;
    }

    // PRIVATE METHODS

    _confirmLocalInstallations() {
        const homeDir = os.homedir();
        var localInstallations = [];
        if(fs.existsSync(homeDir + '/Library/Application Support/' + apps.local)) {
            localInstallations.push(apps.local);
        }
        if(fs.existsSync(homeDir + '/Library/Application Support/' + apps.localBeta)) {
            localInstallations.push(apps.localBeta);
        }
        return localInstallations;
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
            this.env.error(chalk.red('🚨 ERROR: ') + 'No installations of Local found! Please install Local at https://localwp.com to create an addon.');
        }
        // check existing Local addons
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
    }

    writing() {
        // clone boilerplate, unpack, setup, etc
    }

    install() {
       // symlink new addon (if needed)
       // enable addon (if needed)
    }

    end() {
        // clean up as needed
        // confirm success/failure
        // print next steps, links, etc
    }
}

module.exports = LocalAddonGenerator;