const Generator = require('yeoman-generator');

class LocalAddonGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.argument('addonName', {
            required: false,
            type: String,
            desc: 'name for the new add-on'
        });

        this.option('beta');  // preference to install for Local Beta
        this.option('disable');  // don't enable new addon right away

    }

    // CONFIGURATION ACCESSOR METHODS

    __addonName() {
        return this.options.addonName ? this.options.addonName : this.configurations.addonName;
    }

    // PRIVATE METHODS

    // ...

    // ORDERED GENERATOR STEPS

    initializing() {
        // print greeting, instructions, etc
        // check Local installations
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