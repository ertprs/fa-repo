
import * as dataTempo from 'node-datetime';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';


export const GetFileCode = function() {
    // const e = new Error();
    // const regex = /\((.*):(\d+):(\d+)\)$/;
    // const match = regex.exec(e.stack.split("\n")[2]);
    // let filename = match[1].substring(match[1].lastIndexOf('\\')+1);
    // let sResult = 'Arquivo: ' + filename + ' - Linha: ' + match[2] + ' - Coluna: ' + match[3];
    

    let sE = new Error();
    let sLine = sE.stack.split("\n")[2];
    let sValue = sLine.substring(sLine.lastIndexOf('\\') + 1);
    let sMatch = sValue.split(':');

    // let filename = match[1].substring(match[1].lastIndexOf('\\')+1);
    let sResult = 'Arquivo: ' + sMatch[0] + ' - Linha: ' + sMatch[1] + ' - Coluna: ' + sMatch[2];
    return sResult;

  }

// export const GetFileCode = async () => {
//     let sE = new Error();
//     let sRegex = /\((.*):(\d+):(\d+)\)$/
//     let sLine = sE.stack.split("\n")[3];
//     let sValue = sLine.substring(sLine.lastIndexOf('\\') + 1);
//     let sMatch = sValue.split(':');

//     // let filename = match[1].substring(match[1].lastIndexOf('\\')+1);
//     let sResult = 'Arquivo: ' + sMatch[0] + ' - Linha: ' + sMatch[1] + ' - Coluna: ' + sMatch[2];
//     // let sResult = '';
//     return sResult.toString;
// }

export const Log = async (evento: string) => {
   
    let dt = dataTempo.create();
    let fileName = dt.format('d_m_Y') + '.log';
    let dir = path.join(__dirname, '..', 'log');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    console.log(chalk.blue(dt.format('d/m/Y H:M:S') + '|' + evento));
    fs.appendFile(path.join(dir, fileName), dt.format('d/m/Y H:M:S') + " | " + evento + '\n\n', (error) => {
        if (error !== null) {
            console.log(chalk.red('Erro ao salvar Log: ' + error.stack));
        }
    });
}

export const LogErro = (evento: string, erro: Error) => {
    let dt = dataTempo.create();
    let fileName = dt.format('d_m_Y') + '.log';
    let dir = path.join(__dirname, '..', 'logErro');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log(chalk.red(dt.format('d/m/Y H:M:S') + '|' + evento + '\n' + erro.stack));

    fs.appendFile(path.join(dir, fileName), dt.format('d/m/Y H:M:S') + " | " + evento + '\n' + erro.stack + '\n\n', (error) => {
        if (error !== null) {
            console.log(chalk.red('Erro ao salvar LogErro: ' + error.stack));
        }
    });
}