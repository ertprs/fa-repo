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
const agente_model_1 = require("./../../models/agente-model");
const remetente_model_1 = require("./../../models/remetente-model");
const conexao_1 = require("./../../libs/conexao");
const atendimento_model_1 = require("./../../models/atendimento-model");
const dataTempo = require("node-datetime");
const atendimento_controller_1 = require("./../../controllers/atendimento-controller");
const io_1 = require("./../../libs/io");
const authenticate_inicia_atendimento_service_1 = require("./services/authenticate-inicia-atendimento-service");
exports.iniciaNewAtendimento = (destino, tronco_id, mensagem, agente_id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('begin new atm');
    // console.log('tronco_id: ',tronco_id);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    let agente = yield agente_model_1.getAgenteById(agente_id);
    let tronco = yield remetente_model_1.getRemetenteById(tronco_id);
    let atendimento = yield authenticate_inicia_atendimento_service_1.authenticateAtendimento(destino, tronco_id);
    // console.log('atm: ',atendimento);
    if (atendimento.status) {
        io_1.io.emit('retornoIniciarAtendimento', JSON.stringify({
            agente_id: agente.id,
            resposta: 'False',
            telefone: destino
        }));
        return;
    }
    else {
        io_1.io.emit('retornoIniciarAtendimento', JSON.stringify({
            agente_id: agente.id,
            resposta: 'True',
            telefone: destino
        }));
    }
    destino = (destino.length == 13 ? destino : destino.substring(0, 4) + '9' + destino.substring(4));
    let cliente = yield authenticate_inicia_atendimento_service_1.authenticateCliente(destino, tronco.empresa_id);
    var novoAtendimento = {
        id: 0,
        nome: cliente.data.nome,
        protocolo: '',
        numero: cliente.data.telefone,
        avatar: cliente.data.whatsapp_url_avatar,
        nivel: 0,
        empresa_id: tronco.empresa_id,
        grupo_id: agente.grupo_id,
        agente_id: agente.id,
        remetente_id: tronco.id,
        datahora_inicio: data,
        datahora_fila: data,
        datahora_atendimento: data,
        tipo: 'WHATSAPP',
        chave: 'ChaveFalse',
        cliente: cliente.data,
        preAtendimento: true,
        emEntendimento: false,
        ura_id: 0,
        tranfer_new: false,
        intervencao: 'False',
        inicio_atm: true
    };
    let data2 = new Date();
    let sProtocolo = yield conexao_1.database.query("CALL sp_getprotocolo('" + novoAtendimento.numero + "');");
    novoAtendimento.protocolo = sProtocolo[0][0][0].protocolo;
    // novoAtendimento.protocolo = data2.getFullYear().toString() + checkNumero(data2.getMonth() + 1).toString() +
    //         checkNumero(data2.getDate()).toString() + checkNumero(data2.getHours()).toString() + checkNumero(data2.getMinutes()).toString() +
    //         + checkNumero(data2.getSeconds()).toString();
    yield conexao_1.database.query("insert into tb_atendimento (protocolo, datahora_inicio, datahora_fila, datahora_atendimento, grupo_id, agente_id, empresa_id, tipo, cliente_id, remetente_id, cliente_chave) values ('" +
        novoAtendimento.protocolo + "', '" + data + "', '" + data + "', '" + data + "', " + novoAtendimento.grupo_id + ", " + agente.id + ", " + novoAtendimento.empresa_id +
        ", '" + novoAtendimento.tipo + "', " + cliente.data.id + ", " + tronco.id + ", '" + novoAtendimento.chave + "');");
    let atendimentoId = yield conexao_1.database.query("select * from tb_atendimento where protocolo = '" + novoAtendimento.protocolo +
        "' and grupo_id = '" + novoAtendimento.grupo_id + "' order by id desc limit 1");
    // console.log('new mega id of the atendimento: ' + atendimentoId[0][0].id);
    novoAtendimento.id = atendimentoId[0][0].id;
    // //adiciona atm no array
    yield atendimento_model_1.addAtendimento(novoAtendimento);
    yield atendimento_controller_1.updateDataHoraFilaAtendimento(novoAtendimento.id);
    let atm = yield atendimento_model_1.getAtendimentoById(novoAtendimento.id);
    // atm.cliente = clienteAr[0][0];
    // await tronco.page.evaluate("sendMessageToId('" + novoAtendimento.chave + "','" + mensagem + "');");
    yield tronco.page.evaluate('sendMessageToNumber("' + destino + '","' + mensagem.trim().replace(/(?:\r\n|\r|\n)/g, '\\n') + '");');
    // await tronco.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + destino + "');");   
    atendimento_controller_1.setAgenteAtendimento(agente, atm);
    // gravar mensagem no banco
    yield conexao_1.database.query("insert into tb_mensagem (atendimento_id, origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id, base64file, file_name, type_file, exists_image, " +
        " exists_document, type_mensagem) values (" + novoAtendimento.id + ",'AGENTE', " + agente_id + ", '" + data + "','" + (mensagem ? mensagem + ' <br>' : '') + "', " + novoAtendimento.empresa_id + ", " +
        " 'null', 'null', '',  '', '', 'False', 'False', 'texto')");
    io_1.io.emit('newAtendimentoSuccess', JSON.stringify({
        agente_id: agente.id,
        resposta: true
    }));
});
//# sourceMappingURL=inicia-atendimento.js.map