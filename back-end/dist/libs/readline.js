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
const readline = require("readline");
const agente_model_1 = require("./../models/agente-model");
const logs_1 = require("./../globais/logs");
const atendimento_model_1 = require("./../models/atendimento-model");
const io_1 = require("./io");
const remetente_model_1 = require("./../models/remetente-model");
exports.rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
exports.rl.on('line', (input) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        if (input == 'getRemetentes') {
            return logs_1.Log(JSON.stringify(yield remetente_model_1.getRemetentes()));
        }
        if (input == 'getAgentes') {
            return logs_1.Log(JSON.stringify(yield agente_model_1.getAgentes()));
        }
        if (input == 'getAtendimentos') {
            return logs_1.Log(JSON.stringify(yield atendimento_model_1.getAtendimentos()));
        }
        if (input == 'reloadAgentes') {
            let agentes = yield agente_model_1.getAgentes();
            for (let index = 0; index < agentes.length; index++) {
                const agente = agentes[index];
                io_1.io.emit('deslogar', agente.grupo_id);
                console.log('Desconectando agente!');
            }
            return;
        }
        return console.log('Comando inválido!');
    }))();
});
//# sourceMappingURL=readline.js.map