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
const conexao_1 = require("./../libs/conexao");
const dataTempo = require("node-datetime");
const atendimento_model_1 = require("./../models/atendimento-model");
const remetente_model_1 = require("./../models/remetente-model");
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
// import { iniciaAtendimentoWA } from './iniciaAtendimentoWA';
const mensagem_service_1 = require("./../controllers/mensagem-service");
const agente_model_1 = require("./../models/agente-model");
exports.transferenciaAtendimento = (atendimento_id, agente_transferencia_id, grupo_id, remetente_id, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    let data = dt.format('Y-m-d H:M:S');
    console.log('### Trans: 1');
    if (atendimento) {
        if (!atendimento.datahora_inicio) {
            atendimento.datahora_inicio = data;
        }
        if (!atendimento.datahora_fila) {
            atendimento.datahora_fila = data;
        }
        if (!atendimento.datahora_atendimento) {
            atendimento.datahora_atendimento = data;
        }
    }
    yield atendimento_controller_1.finalizaAtendimento(atendimento, false);
    console.log('### Trans: 2');
    console.log('grava arquivo atendimento transferencia na tb atm_tranfer');
    yield conexao_1.database.query("insert into tb_atendimento_transferencia (empresa_id, atendimento_id, agente_id, agente_transferencia_id, remetente_id, grupo_id, datahora_transferencia) values (" +
        atendimento.empresa_id + ", " + atendimento.id + ", " + atendimento.agente_id + ", " + (agente_transferencia_id ? agente_transferencia_id : null) + ", " + remetente_id +
        ", " + grupo_id + ", '" + data + "');");
    console.log('### Trans: 3');
    var novoAtendimento = {
        id: 0,
        nome: atendimento.nome,
        protocolo: atendimento.protocolo,
        numero: atendimento.numero,
        avatar: atendimento.avatar,
        nivel: 0,
        empresa_id: atendimento.empresa_id,
        grupo_id: grupo_id,
        agente_id: (agente_transferencia_id ? agente_transferencia_id : null),
        remetente_id: remetente_id,
        datahora_inicio: data,
        datahora_fila: data,
        tipo: atendimento.tipo,
        chave: atendimento.chave,
        cliente: atendimento.cliente,
        preAtendimento: true,
        emEntendimento: false,
        ura_id: 0,
        tranfer_new: true,
        intervencao: 'False'
    };
    console.log('### Trans: 4');
    // await iniciaAtendimento(novoAtendimento);    
    // console.log('grava arquivo atendimento transferencia na tb atm');
    yield conexao_1.database.query("insert into tb_atendimento (protocolo, datahora_inicio, datahora_fila, grupo_id, agente_id, empresa_id, tipo, cliente_id, remetente_id, cliente_chave) values ('" +
        atendimento.protocolo + "', '" + data + "', '" + data + "', " + grupo_id + ", " + (agente_transferencia_id ? agente_transferencia_id : null) + ", " + atendimento.empresa_id +
        ", '" + atendimento.tipo + "', " + atendimento.cliente.id + ", " + remetente_id + ", '" + atendimento.chave + "');");
    let atendimentoId = yield conexao_1.database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
        "' and grupo_id = '" + novoAtendimento.grupo_id + "' order by id desc limit 1");
    // console.log('new mega id of the atendimento: ' + atendimentoId[0][0].id);
    novoAtendimento.id = atendimentoId[0][0].id;
    //adiciona atm no array
    yield atendimento_model_1.addAtendimento(novoAtendimento);
    //inicia um novo atm
    // console.log('novo mega atm: ',novoAtendimento);
    // await iniciaAtendimentoWA(novoAtendimento);
    let remetente = yield remetente_model_1.getRemetenteById(novoAtendimento.remetente_id);
    yield atendimento_controller_1.updateDataHoraFilaAtendimento(novoAtendimento.id);
    if (atendimento.chave == 'ChaveFalse') {
        yield remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Seu Atendimento Está sendo transferido, aguarde o agente.");');
        // if (remetente.config.funcao_encerrar_atendimento != 'NAOEXISTEPALAVRA') {
        //     await remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Para encerrar o atendimento a qualquer momento digite: ' + remetente.config.funcao_encerrar_atendimento + '");');
        // }
    }
    else {
        yield remetente.page.evaluate('sendMessageToId("' + novoAtendimento.chave + '","Seu Atendimento Está sendo transferido, aguarde o agente.");');
        // if (remetente.config.funcao_encerrar_atendimento != 'NAOEXISTEPALAVRA') {
        //     await remetente.page.evaluate('sendMessageToId("' + novoAtendimento.chave + '","Para encerrar o atendimento a qualquer momento digite: ' + remetente.config.funcao_encerrar_atendimento + ' ");');
        // }
    }
    //novos campos: base64file file_name type_file exists_image exists_document
    yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel2_pergunta + ' ' + remetente.config.funcao_encerrar_atendimento, atendimento.chave, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
    if (atendimento.chave == 'ChaveFalse') {
        // console.log('retorno numero chave: ',atendimento.cliente.telefone);
        // await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.cliente.telefone + "');");
    }
    else
        yield remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
    atendimento.nivel = 3;
    if (novoAtendimento.agente_id && novoAtendimento.agente_id != 0) {
        let agente = yield agente_model_1.getAgenteById(novoAtendimento.agente_id);
        if (agente.qtdEmAtendimento < remetente.config.qtd_atendimento_simultaneo) {
            atendimento_controller_1.setAgenteAtendimento(agente, novoAtendimento);
        }
        else {
            novoAtendimento.agente_id = null;
            yield atendimento_controller_1.checkAgenteDisponivel(novoAtendimento);
        }
    }
    else {
        yield atendimento_controller_1.checkAgenteDisponivel(novoAtendimento);
    }
    // console.log('atm depois: ',atendimento);
});
//# sourceMappingURL=transferenciaAtendimento.js.map