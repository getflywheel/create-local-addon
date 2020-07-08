const chalk = require('chalk');

const title = chalk.greenBright(`
██╗      ██████╗  ██████╗ █████╗ ██╗          █████╗ ██████╗ ██████╗        ██████╗ ███╗   ██╗     ██████╗██████╗ ███████╗ █████╗ ████████╗ ██████╗ ██████╗ 
██║     ██╔═══██╗██╔════╝██╔══██╗██║         ██╔══██╗██╔══██╗██╔══██╗      ██╔═══██╗████╗  ██║    ██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗
██║     ██║   ██║██║     ███████║██║         ███████║██║  ██║██║  ██║█████╗██║   ██║██╔██╗ ██║    ██║     ██████╔╝█████╗  ███████║   ██║   ██║   ██║██████╔╝
██║     ██║   ██║██║     ██╔══██║██║         ██╔══██║██║  ██║██║  ██║╚════╝██║   ██║██║╚██╗██║    ██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██║   ██║██╔══██╗
███████╗╚██████╔╝╚██████╗██║  ██║███████╗    ██║  ██║██████╔╝██████╔╝      ╚██████╔╝██║ ╚████║    ╚██████╗██║  ██║███████╗██║  ██║   ██║   ╚██████╔╝██║  ██║
╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═════╝ ╚═════╝        ╚═════╝ ╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
`);

const ascii = chalk.green(`
                                                                                
                                ////////////////,                               
                             //////////////////////                             
                          ////////////////////////////                          
                        ///////////` + chalk.white(`@@%)`) + `\\\\` + chalk.white(`(#@@`) + `////////////                        
                     ////////////` + chalk.white(`(@@@@)`) + `\\\\` + chalk.white(`(@@@@%`) + `////////////                     
                   ////////////` + chalk.white(`@@@@@@@)`) + `\\\\` + chalk.white(`(@@@@@@@`) + `////////////                   
                ////////////` + chalk.white(`(@@@@`) + `%/` + chalk.white(`@@@)`) + `\\\\` + chalk.white(`(@@@`) + `/(` + chalk.white(`@@@@%`) + `////////////                
              ////////////` + chalk.white(`@@@@@`) + `////` + chalk.white(`@@@)`) + `\\\\` + chalk.white(`(@@@`) + `////` + chalk.white(`@@@@@`) + `////////////              
           ////////////` + chalk.white(`(@@@@%`) + `////` + chalk.white(`#@@@@)`) + `\\\\` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@@%`) + `////////////           
         ////////////` + chalk.white(`@@@@@`) + `/////` + chalk.white(`@@@@@`) + `////////` + chalk.white(`@@@@@`) + `(////` + chalk.white(`@@@@@`) + `////////////         
      ////////////` + chalk.white(`(@@@@%`) + `////` + chalk.white(`#@@@@#`) + `////////////` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@@%`) + `////////////      
    *///////////` + chalk.white(`@@@@@`) + `/////` + chalk.white(`@@@@@`) + `////` + chalk.white(`#@@@@@@@@`) + `(////` + chalk.white(`@@@@@`) + `(////` + chalk.white(`@@@@@`) + `////////////    
   //////////` + chalk.white(`(@@@@%`) + `////` + chalk.white(`#@@@@#`) + `//////////////////////` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@@%`) + `//////////*  
  /////////` + chalk.white(`(@@@@`) + `/////` + chalk.white(`@@@@@`) + `/////` + chalk.white(`@@@@@@@@@@@@@@@@@@`) + `/////` + chalk.white(`@@@@@`) + `(//` + chalk.white(`@@@@@@&`) + `/////////  
  ////////` + chalk.white(`#@@@`) + `(///` + chalk.white(`#@@@@#`) + `////////////////////////////////` + chalk.white(`(@@@@@@@@`) + `/` + chalk.white(`@@@@`) + `///////// 
  ////////` + chalk.white(`@@@@`) + `//` + chalk.white(`@@@@@@`) + `(///` + chalk.white(`@@@@@@@@@@@@@@@@@@@@@@@@@@@@`) + `////` + chalk.white(`&@@@@`) + `///` + chalk.white(`%@@@`) + `///////// 
  /////////` + chalk.white(`@@@@@@@@(@@@@&`) + `///////////////////////////////` + chalk.white(`@@@@&`) + `////` + chalk.white(`&@@@#`) + `////////, 
  ./////////` + chalk.white(`%@@@@@`) + `////` + chalk.white(`@@@@@`) + `(///` + chalk.white(`@@@@@@@@@@@@@@@@@@`) + `////` + chalk.white(`&@@@@`) + `/////` + chalk.white(`@@@@@`) + `//////////  
   ,//////////` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@@&`) + `/////////////////////` + chalk.white(`@@@@&`) + `////` + chalk.white(`#@@@@%`) + `///////////   
     ////////////` + chalk.white(`&@@@@`) + `(////` + chalk.white(`@@@@@`) + `(//` + chalk.white(`(@@@@@@@@(`) + `///` + chalk.white(`&@@@@`) + `/////` + chalk.white(`@@@@@`) + `////////////     
       .///////////` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@@&`) + `///////////` + chalk.white(`@@@@&`) + `////` + chalk.white(`#@@@@%`) + `///////////*       
          ////////////` + chalk.white(`&@@@@`) + `(////` + chalk.white(`@@@@@`) + `(/////` + chalk.white(`&@@@@`) + `/////` + chalk.white(`@@@@@`) + `////////////          
            .///////////` + chalk.white(`(@@@@&`) + `////` + chalk.white(`(@@@)`) + `//` + chalk.white(`(@@@&`) + `////` + chalk.white(`#@@@@%`) + `///////////*            
               ////////////` + chalk.white(`&@@@@`) + `(//` + chalk.white(`@@@)`) + `//` + chalk.white(`(@@@`) + `///` + chalk.white(`@@@@@`) + `////////////               
                 .///////////` + chalk.white(`(@@@@&@@@)`) + `//` + chalk.white(`(@@@#@@@@%`) + `///////////*                 
                    ////////////` + chalk.white(`&@@@@@)`) + `//` + chalk.white(`(@@@@@@`) + `////////////                    
                      .///////////` + chalk.white(`(@@@)`) + `//` + chalk.white(`(@@@%`) + `///////////*                      
                         //////////////////////////////                         
                           .////////////////////////*                           
                              ////////////////////                              
                                  ////////////                                  
`);

const help = `
Usage:
    yo create-local-addon [<productname>] [<directoryname>] [options]

Options:
            --help               # Print the generator's options and usage

            --beta               # Preference to install add-on for Local Beta                                                         Default: false

            --place-directly     # Place add-on directory directly into Local add-ons directory (automatically adds --do-not-symlink)  Default: false
            --do-not-symlink     # Skip creating a symbolic link in Local add-ons directory to your add-on directory                   Default: false
            --disable            # Skip building and enabling add-on                                                                   Default: false

            --verbose            # Print more detailed information and status updates during the setup process                         Default: false
            --show-error-traces  # Print full error messages on occurrence                                                             Default: false

Arguments:
    productname    # Product/display name for the new add-on     Type: String  Required: false
    directoryname  # Directory/internal name for the new add-on  Type: String  Required: false

You can also consult documentation for more inforamtion: https://github.com/getflywheel/create-local-addon#getting-started
`

module.exports = { title, ascii, help };