const Generator = require('yeoman-generator');

class LocalAddonGenerator extends Generator {
    constructor(args, opts) {
        super(args, opts);

        //...
    }

    // PRIVATE METHODS

    //...

    // ORDERED GENERATOR STEPS

    initializing() {
        // print greeting, instructions, etc
        // check Local installations
        // check existing Local addons
    }

    prompting() {
        // get addon name (if needed)
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