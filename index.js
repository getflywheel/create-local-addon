const yeoman = require('yeoman-environment');
var env = yeoman.createEnv();

// Here we register the add-on generator based on its path. 
env.register(require.resolve('./app'), 'create-local-addon:app');

// Run create-locak-addon generator
env.run('create-local-addon:app', () => {});