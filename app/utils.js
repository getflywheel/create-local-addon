const fs = require('fs-extra');
const jetpack = require('fs-jetpack');
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

const getLocalDirectory = function(localApp) {
    const platform = os.platform();
    if(platform === platforms.macOS) {
        return path.join(os.homedir(), 'Library/Application Support', localApp);
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

const confirmExistingLocalAddonDirectories = function(localApp) {
    var existingAddonDirectories = new Set();
    fs.readdirSync(getLocalDirectory(localApp) + '/addons').forEach((addonDirectory) => existingAddonDirectories.add(addonDirectory));
    return existingAddonDirectories;
};

const confirmExistingLocalAddonNames = function(localApp) {
    var existingAddonNames = new Set();
    const localAddonsPath = getLocalDirectory(localApp) + '/addons';
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

const enableAddon = function(localApp, addonName) {
    const enabledAddons = path.join(getLocalDirectory(localApp), 'enabled-addons.json');
    const enabledAddonsJSON = fs.readJsonSync(enabledAddons);
    enabledAddonsJSON[addonName] = true
    fs.readJsonSync(enabledAddons, enabledAddonsJSON);
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