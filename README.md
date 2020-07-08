# Create Local Add-on
A generator to assist in the development of new Local add-ons. Generates a basic add-on to act as a starting point for development.

So you want to create your own Local add-on? Look no further! This generator can help you get up and running in no time with your own add-on.


## Local Add-ons
Local is even better with add-ons! Add-ons can add extra functionality and convienience to your development workflow. There are some amzing add-ons already available for Local in the add-on marketplace –– but the best add-ons could be the ones you make yourself! This generator is designed to help you get started building your own add-on with little effort; it takes care of all the setup and lets you focus on making an amazing new add-on for the Local application.

Once you are done, you can easily use your add-on within Local to enhance your workflow. If you want to go a step further, you can even submit your add-on to be added to the public Local add-on marketplace!

## Getting Started
The *Create Local Add-on* generator is designed to get you started with minimal setup. 

The only required information you have to supply is **the product name** for your new add-on and **a name for the directory** where the files for your add-on will be placed. You can suppply both of these as command line arguments to the generator; if you do not give one or both in the command line, you will be prompted to supply them.

By default, the generator will pull down a boilerplate add-on, set up this new add-on in your current directory, symlink the add-on into the Local add-ons directory, and enable to add-on within the Local application. You choose to skip each of these default steps by using flags:

* using `--place-directly` will place your new add-on directly into the Local add-ons directory (rather than your current directory).
* using `--do-not-symlink` will not symlink your new add-on into the Local add-ons directory (automatically added if `--place-directly` is used).
* using `--disable` will not enable your new add-on in the Local application.

If you are developing this add-on for Local Beta, you can designate this preference with the `--beta` flag.
Note: if you use the `--beta` flag, but no installation of Local Beta is found, your add-on will be installed for the normal Local application.


**If the bash help layout is more your style:**

```
Usage:
    yo create-local-addon [<productname>] [<directoryname>] [options]

Options:
            --help               # Print the generator's options and usage

            --beta               # Preference to install add-on for Local Beta                                                         Default: false

            --place-directly     # Place add-on directory directly into Local add-ons directory (automatically adds --do-not-symlink)  Default: false
            --do-not-symlink     # Skip creating a symbolic link in Local add-ons directory to your add-on directory                   Default: false
            --disable            # Skip building and enabling add-on                                                                   Default: false

            --verbose            # Print more detailed information and status updates during the setup process                                                       Default: false
            --show-error-traces  # Print full error messages on occurrence                                                             Default: false

Arguments:
    productname    # Product/display name for the new add-on     Type: String  Required: false
    directoryname  # Directory/internal name for the new add-on  Type: String  Required: false
```

## Next Steps
Here are some tips to help you get started after you have used the generator to set up your add-on.

### Making changes to your add-on:
A symlink pointing to your add-on directory will be been made in the Local add-ons directory, unless you override this preference:

macOS: `~/Library/Application Support/Local/addons/your-new-local-addon`

---

After your basic add-on has been created, you can change your add-on by making changes to the source files:

`~/.../your-new-local-addon/src`

*Boilerplate.jsx and renderer.jsx will have some basic logic in them to give you a starting point, but you'll probably want to make some changes.*

---

You can compile, watch add-on source files, and trigger recompilation on change:

```
cd ~/.../your-new-local-addon  
yarn build --watch
```

*You can leave the --watch flag off if you just want to compile your changes once.*

## Other Resources
* [Local Homepage](https://localwp.com/)
* [Helpful Resources](https://localwp.com/get-involved)
* [Building a Local Add-on](https://localwp.com/get-involved/build)
* [Local Add-on API](https://github.com/getflywheel/local-docs-addon-api)
* [Submit an Add-on to the Local Marketplace](https://localwp.com/submit-addon)