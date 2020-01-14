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
const atendimento_model_1 = require("./../../models/atendimento-model");
const mensagem_service_1 = require("./../../controllers/mensagem-service");
exports.gravarMensagemPreAtm = (atendimento_id, mensagem) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('gravar msg pre atm');
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    if (mensagem.messages[0].type == 'chat') {
        yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
    }
    else if (mensagem.messages[0].type == 'chat') {
    }
});
//# sourceMappingURL=gravar-mensagem-pre-atm-service.js.map