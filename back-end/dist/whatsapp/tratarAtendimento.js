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
const remetente_model_1 = require("../models/remetente-model");
const atendimento_controller_1 = require("../controllers/atendimento-controller");
const mensagem_service_1 = require("./../controllers/mensagem-service");
const horario_funcionamento_controller_1 = require("./../controllers/horario-funcionamento-controller");
exports.tratarAtendimento = (atendimento, mensagem, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
    //### VERIFICAR HORARIO DE FUNCIONAMENTO ###
    let horariosFuncionamentos = yield horario_funcionamento_controller_1.horarioFuncionamento(remetente_id);
    console.log('horariosFuncionamentos: ', horariosFuncionamentos);
    if (horariosFuncionamentos.status == false) {
        console.log('Não está dentro do horário: ', horariosFuncionamentos);
        //gravar mensgem
        if (mensagem.messages[0].type == 'chat') {
            yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
        }
        else if (mensagem.messages[0].type == 'image') {
            yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null, '', '', '', 'False', 'False', 'image', 'null');
        }
        else {
            yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
        }
        //envio de mensagem fora do horario
        yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + horariosFuncionamentos.data.mensagem + '" );');
        return;
    }
    for (let index = 0; index < mensagem.messages.length; index++) {
        const msg = mensagem.messages[index];
        let type_mensagem = 'texto';
        if (msg.type == 'image') {
            type_mensagem = 'image';
        }
        if (msg.message) {
            let quotedMessage = 'null';
            if (msg.quotedMessage) {
                if (msg.quotedMessage.type == 'chat') {
                    // quotedMessage = msg.quotedMessage.message;
                    let fromId = msg.quotedMessage.fromId.split("@");
                    quotedMessage = msg.quotedMessage.message + '$$$$' + fromId[0];
                }
            }
            if (msg.message.trim().toUpperCase() == remetente.config.funcao_encerrar_atendimento.toUpperCase()) {
                yield atendimento_controller_1.finalizaAtendimento(atendimento, true);
                if (atendimento.chave == 'ChaveFalse') {
                    yield remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Atendimento Finalizado com sucesso!");');
                }
                else {
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","Atendimento Finalizado com sucesso!");');
                    yield remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
                }
                return;
            }
            else {
                if (!atendimento.agente_id) {
                    console.log('att chave atm tratar ' + atendimento.chave);
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_nenhum_agente_disponivel + '");');
                    yield remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
                }
                //novos campos: base64file file_name type_file exists_image exists_document
                mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null, '', '', '', 'False', 'False', type_mensagem, quotedMessage);
            }
        }
        else {
            mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', '', msg.id, 0, null, '', '', '', 'False', 'False', type_mensagem, 'null');
        }
    }
});
//# sourceMappingURL=tratarAtendimento.js.map