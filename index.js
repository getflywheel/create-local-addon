#!/usr/bin/env node

/**
 * Accept arguments/options and call Yeoman generator without user needing to install and use 'yo' keyword.
 * See https://yeoman.io/authoring/integrating-yeoman.html for more info.
 */

import minimist from "minimist";
import { createEnv } from "yeoman-environment";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const argv = minimist(process.argv.slice(2)); // Read all CLI args

const argsList = argv._; // Pick out only arguments (productname and directory name)
/**
 * Wrap each argument in double-quotes so they are not split incorrectly
 * You may think there should be a space between each quoted argument, but you would be wrong.
 * Even though you would normally put a space between each quoted argument, putting one here causes extra, empty arguments to be read by Yo for some reason.
 */
const args = argsList.length > 0 ? `"${argsList.join('""')}"` : "";
const opts = Object.fromEntries(
  Object.entries(argv).filter(([key, value]) => key !== "_")
); // Pick out only options/flags

const env = createEnv();

// Register add-on generator based on its path
env.register(require.resolve("./app"), "create-local-addon:app");

// Run create-local-addon generator
env.run(`create-local-addon:app ${args}`, opts);
