const chalk = require('chalk');
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
            --help            # Print the generator's options and usage

            --beta            # Preference to install add-on for Local Beta                                                         Default: false

            --place-directly  # Place add-on directory directly into Local add-ons directory (automatically adds --do-not-symlink)  Default: false
            --do-not-symlink  # Skip creating a symbolic link in Local add-ons directory to your add-on directory                   Default: false
            --disable         # Skip enabling add-on                                                                                Default: false

            --verbsose        # Print error messages on occurrence                                                                  Default: false
            --silent          # Do not print any logs that are not warnings or errors                                               Default: false

Arguments:
    productname    # Product/display name for the new add-on     Type: String  Required: false
    directoryname  # Directory/internal name for the new add-on  Type: String  Required: false
`

module.exports = { ascii, help };