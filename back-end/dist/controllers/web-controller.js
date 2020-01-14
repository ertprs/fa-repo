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
const io_1 = require("./../libs/io");
const remetente_model_1 = require("./../models/remetente-model");
exports.webAtendimentoNaoInicado = (dadosCliente) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('dados do cliente: ', dadosCliente);
});
exports.verificaUraWeb = (tronco_id, empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(tronco_id + ' - ' + empresa_id);
    let tronco = yield remetente_model_1.getRemetenteById(tronco_id);
    console.log('tronco.config.permitir_ura :', tronco.config.permitir_ura);
    if (tronco.config.permitir_ura == 0) {
        io_1.io.emit('resultUraWeb', { result: 'error' });
    }
    else {
        let dadosUraWeb = yield conexao_1.database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
        if (dadosUraWeb[0]) {
            io_1.io.emit('resultUraWeb', { result: 'success' });
        }
        else
            io_1.io.emit('resultUraWeb', { result: 'error' });
    }
});
exports.retornoListaUraWeb = (empresa_id, cpf_cliente) => __awaiter(void 0, void 0, void 0, function* () {
    let dadosUra = yield conexao_1.database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
    //console.log('dados ura: ' +  JSON.stringify(dadosUra[0]));
    io_1.io.emit('respListUra', JSON.stringify(dadosUra[0]), cpf_cliente);
});
exports.ligarClienteChatWeb = (cliente, config) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('cliente: ', cliente);
    console.log('config: ', config);
    io_1.io.emit('resLigarClienteChatWeb', { success: 'success', msg: 'Entraremos em contato, em horário comercial!' });
});
exports.iniciarWhatsAppChatWeb = (cliente, tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('cliente: ', cliente);
    console.log('tronco_id: ', tronco_id);
    let dt = dataTempo.create(cliente.data_inicio);
    let data = dt.format('Y-m-d H:M:S');
    let tronco = yield remetente_model_1.getRemetenteById(tronco_id);
    let mensagem = 'Olá seja bem vindo ao SomaSac nossa central de relacionamento via WhatsApp. Como podemos lhe ajudar?';
    yield tronco.page.evaluate('sendMessageToNumber("' + cliente.telefone + '","' + mensagem.trim().replace(/(?:\r\n|\r|\n)/g, '\\n') + '");');
    io_1.io.emit('inicioAtendimentoWebWhatsApp', { result: true });
});
//# sourceMappingURL=web-controller.js.map