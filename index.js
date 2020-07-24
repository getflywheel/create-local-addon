#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2)); // Read all CLI args

const arguments = argv._; // Pick out only arguments (productname and directory name)
const args = arguments.length > 0 ? `"${arguments.join('" "')}"` : ''; // Wrap each argument in double-quotes so they are not split incorrectly
const opts = Object.fromEntries(Object.entries(argv).filter(([key, value]) => key !== '_')); // Pick out only options/flags

const yeoman = require('yeoman-environment');
var env = yeoman.createEnv();

// Register add-on generator based on its path
env.register(require.resolve('./app'), 'create-local-addon:app');

console.log(`RUNNING: create-local-addon:app ${args} ${Object.entries(opts)}`);

// Run create-local-addon generator
env.run(`create-local-addon:app ${args}`, opts, () => { console.log('DONE') });