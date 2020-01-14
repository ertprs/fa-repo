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
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
const funcs_1 = require("./../globais/funcs");
const remetente_model_1 = require("./../models/remetente-model");
const mensagem_service_1 = require("./../controllers/mensagem-service");
const dataTempo = require("node-datetime");
exports.iniciaAtendimentoWA = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    // await checkClienteWA(atendimento);
    // let data = new Date();
    // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
    //     checkNumero(data.getDate()).toString() + atendimento.cpf.substring(0, 4) + checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
    //     + checkNumero(data.getSeconds()).toString();
    // atendimento.grupo_id = remetente.grupo_id;
    console.log('em atendimento bool: ' + atendimento.preAtendimento);
    if (atendimento.preAtendimento == false || atendimento.preAtendimento == undefined) {
        // console.log('entrei no atm wa ...')
        let dt = dataTempo.create();
        let data = dt.format('Y-m-d H:M:S');
        atendimento.preAtendimento = true;
        atendimento.datahora_fila = (atendimento.datahora_fila ? atendimento.datahora_fila : data);
        yield atendimento_controller_1.updateDataHoraFilaAtendimento(atendimento.id);
        if (atendimento.ura_id == null) {
            // verificar se a saudação esta permitida 
            if (remetente.config.enviar_saudacao_cliente == 'True') {
                yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + funcs_1.getPeriodoDia() + '! ' + remetente.config.msg_boot_nivel1_pergunta.replace('{cliente}', atendimento.nome).replace('{grupo}', remetente.grupo_nome) + (remetente.config.cpf_obrigatorio == 1 ? ' Por favor, informe seu CPF.' : '') + '");');
            }
            // end saudação permitida
            yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_boot_nivel2_pergunta + ' ");');
            if (remetente.config.permitir_protocolo == 'True')
                yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","O número de protocolo do seu atendimento é: ' + atendimento.protocolo + '");');
        }
        else {
            yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_boot_nivel2_pergunta + ' ");');
            //novos campos: base64file file_name type_file exists_image exists_document
            yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel2_pergunta, atendimento.chave, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
        }
        yield remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
        atendimento.nivel = 3;
        yield atendimento_controller_1.checkAgenteDisponivel(atendimento);
        // console.log('tranferiu o atendimento');
    }
});
//# sourceMappingURL=iniciaAtendimentoWA.js.map