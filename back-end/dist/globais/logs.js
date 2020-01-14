"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dataTempo = require("node-datetime");
const path = require("path");
const fs = require("fs");
const chalk_1 = require("chalk");
exports.GetFileCode = function () {
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
};
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
exports.Log = (evento) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let fileName = dt.format('d_m_Y') + '.log';
    let dir = path.join(__dirname, '..', 'log');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log(chalk_1.default.blue(dt.format('d/m/Y H:M:S') + '|' + evento));
    fs.appendFile(path.join(dir, fileName), dt.format('d/m/Y H:M:S') + " | " + evento + '\n\n', (error) => {
        if (error !== null) {
            console.log(chalk_1.default.red('Erro ao salvar Log: ' + error.stack));
        }
    });
});
exports.LogErro = (evento, erro) => {
    let dt = dataTempo.create();
    let fileName = dt.format('d_m_Y') + '.log';
    let dir = path.join(__dirname, '..', 'logErro');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    console.log(chalk_1.default.red(dt.format('d/m/Y H:M:S') + '|' + evento + '\n' + erro.stack));
    fs.appendFile(path.join(dir, fileName), dt.format('d/m/Y H:M:S') + " | " + evento + '\n' + erro.stack + '\n\n', (error) => {
        if (error !== null) {
            console.log(chalk_1.default.red('Erro ao salvar LogErro: ' + error.stack));
        }
    });
};
//# sourceMappingURL=logs.js.map