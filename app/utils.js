const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const platforms = {
    macOS: 'darwin',
    windows: 'win32',
    linux: 'linux'
};

const apps = {
    local: 'Local',
    localBeta: 'Local Beta'
};

/**
 * recursively removes a directory and all contents within.
 * 
 * @param {string} filePath 
 */
const removeDirectory = function(filePath) {
    if(!fs.existsSync(filePath))
        return;
    if(fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        return;
    }
    fs.readdirSync(filePath).forEach((member) => {
        const memberPath = path.join(filePath, member);
        if(fs.lstatSync(memberPath).isDirectory()) {
            removeDirectory(memberPath);
        } else {
            fs.unlinkSync(memberPath);
        }
    });
    fs.rmdirSync(filePath);
};

/**
 * constructs a path to the directory for a Local application
 * 
 * @param {string} localApp - Local or Local Beta
 */
const getLocalDirectory = function(localApp) {
    const platform = os.platform();
    if(platform === platforms.macOS) {
        // EXAMPLE: `/Users/username/Library/Application Support/Local`
        return path.join(os.homedir(), 'Library', 'Application Support', localApp);
    } else if(platform === platforms.windows) {
        // EXAMPLE: `C:\Users\username\AppData\Roaming\Local`
        return path.join(os.homedir(), 'AppData', 'Roaming', localApp);
    }
};

/**
 * returns a list of all local installations found on the system
 * 
 * @returns {Set<string>} Local Installations
 */
const confirmLocalInstallations = function() {
    var localInstallations = new Set();
    if(fs.existsSync(getLocalDirectory(apps.local))) {
        localInstallations.add(apps.local);
    }
    if(fs.existsSync(getLocalDirectory(apps.localBeta))) {
        localInstallations.add(apps.localBeta);
    }
    return localInstallations;
};

/**
 * returns a mapping between all add-on directories and the corresponding add-on product name
 * (for any one Local application)
 * 
 * @param {string} localApp - Local or Local Beta
 * @returns {Map<string, string>} Existing Add-on Directories and Product Names
 */
const confirmExistingLocalAddons = function(localApp) {
    var existingAddons = new Map();
    const localAddonsPath = path.join(getLocalDirectory(localApp), 'addons');
    fs.readdirSync(localAddonsPath).forEach((addonDirectory) => {
        const addonDirectoryPath = path.join(localAddonsPath, addonDirectory);
        if(!addonDirectory.startsWith('.') && fs.lstatSync(addonDirectoryPath).isDirectory()) {
            const package = path.join(addonDirectoryPath, 'package.json');
            if(fs.existsSync(package)) {
                const packageJSON = fs.readJsonSync(package);
                const addonProductName = packageJSON['productName'];
                existingAddons.set(addonProductName, addonDirectory);
            }
        }
    });
    return existingAddons;
};

/**
 * @param {string} directoryPath 
 */
const getDirectoryContents = function(directoryPath) {
    var contents = new Set();
    fs.readdirSync(directoryPath).forEach((file) => contents.add(file));
    return contents;
}

/**
 * returns a list of all files within the add-ons directory
 * (for any one Local application)
 * 
 * @param {string} localApp - Local or Local Beta
 */
const confirmExistingLocalAddonDirectories = function(localApp) {
    const localAddonsDirectory = path.join(getLocalDirectory(localApp), 'addons');
    return getDirectoryContents(localAddonsDirectory);
};

/**
 * returns a list of the product names for all installed add-ons
 * (for any one Local application)
 * 
 * @param {string} localApp - Local or Local Beta
 */
const confirmExistingLocalAddonNames = function(localApp) {
    var existingAddonNames = new Set();
    const localAddonsPath = path.join(getLocalDirectory(localApp), 'addons');
    fs.readdirSync(localAddonsPath).forEach((addonDirectory) => {
        const addonDirectoryPath = path.join(localAddonsPath, addonDirectory);
        if(!addonDirectory.startsWith('.') && fs.lstatSync(addonDirectoryPath).isDirectory()) {
            const package = path.join(addonDirectoryPath, 'package.json');
            if(fs.existsSync(package)) {
                const packageJSON = fs.readJsonSync(package);
                const addonName = packageJSON['productName'];
                existingAddonNames.add(addonName);
            }
        }
    });
    return existingAddonNames;
};

/**
 * enable the add-on with the given name within the given Local application
 * 
 * @param {string} localApp - Local or Local Beta
 * @param {string} addonName - add-on name ('name' property in add-on package.json)
 */
const enableAddon = function(localApp, addonName) {
    const enabledAddonsPath = path.join(getLocalDirectory(localApp), 'enabled-addons.json');
    const enabledAddonsJSON = fs.readJsonSync(enabledAddonsPath);
    enabledAddonsJSON[addonName] = true;
    fs.writeJsonSync(enabledAddonsPath, enabledAddonsJSON);
};

module.exports = {
    platforms,
    apps,
    removeDirectory,
    getLocalDirectory,
    confirmLocalInstallations,
    confirmExistingLocalAddons,
    getDirectoryContents,
    confirmExistingLocalAddonDirectories,
    confirmExistingLocalAddonNames,
    enableAddon
};