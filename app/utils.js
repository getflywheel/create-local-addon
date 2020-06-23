const fs = require('fs-extra');
const jetpack = require('fs-jetpack');
const os = require('os');

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
            removeDirectory(path + '/' + member);
        } else {
            fs.unlinkSync(path + '/' + member);
        }
    });
    fs.rmdirSync(path);
};

const getLocalDirectory = function(localApp) {
    const platform = os.platform();
    if(platform === platforms.macOS) {
        return os.homedir() + '/Library/Application Support/' + localApp;
    }
};

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

const confirmExistingLocalAddons = function(localApp) {
    var existingAddons = new Map();
    const localAddonsPath = getLocalDirectory(localApp) + '/addons';
    fs.readdirSync(localAddonsPath).forEach((addonDirectory) => {
        if(!addonDirectory.startsWith('.') && fs.lstatSync(localAddonsPath + '/' + addonDirectory).isDirectory()) {
            const package = localAddonsPath + '/' + addonDirectory + '/package.json';
            const packageJSON = jetpack.read(package, 'json');
            if(packageJSON !== undefined) {
                const addonProductName = packageJSON['productName'];
                existingAddons.set(addonProductName, addonDirectory);
            }
        }
    });
    return existingAddons;
};

const confirmExistingLocalAddonDirectories = function(localApp) {
    var existingAddonDirectories = new Set();
    fs.readdirSync(getLocalDirectory(localApp) + '/addons').forEach((addonDirectory) => existingAddonDirectories.add(addonDirectory));
    return existingAddonDirectories;
};

const confirmExistingLocalAddonNames = function(localApp) {
    var existingAddonNames = new Set();
    const localAddonsPath = getLocalDirectory(localApp) + '/addons';
    fs.readdirSync(localAddonsPath).forEach((addonDirectory) => {
        if(!addonDirectory.startsWith('.') && fs.lstatSync(localAddonsPath + '/' + addonDirectory).isDirectory()) {
            const package = localAddonsPath + '/' + addonDirectory + '/package.json';
            const packageJSON = jetpack.read(package, 'json');
            if(packageJSON !== undefined) {
                const addonName = packageJSON['productName'];
                existingAddonNames.add(addonName);
            }
        }
    });
    return existingAddonNames;
};

const enableAddon = function(localApp, addonName) {
    const enabledAddons = getLocalDirectory(localApp) + '/enabled-addons.json';
    const enabledAddonsJSON = jetpack.read(enabledAddons, 'json');
    enabledAddonsJSON[addonName] = true
    jetpack.write(enabledAddons, enabledAddonsJSON);
};

module.exports = {
    platforms,
    apps,
    removeDirectory,
    getLocalDirectory,
    confirmLocalInstallations,
    confirmExistingLocalAddons,
    confirmExistingLocalAddonDirectories,
    confirmExistingLocalAddonNames,
    enableAddon
};