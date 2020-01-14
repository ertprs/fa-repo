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
const atendimento_model_1 = require("./../models/atendimento-model");
const conexao_1 = require("./../libs/conexao");
const logs_1 = require("./../globais/logs");
const dataTempo = require("node-datetime");
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
const remetente_model_1 = require("./../models/remetente-model");
exports.liberarAtedimentoPendente = (atendimento_id) => __awaiter(void 0, void 0, void 0, function* () {
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    atendimento.retirar_pendente = true;
    yield atendimento_controller_1.checkAgenteDisponivel(atendimento);
    logs_1.Log('Atendimento removido da lista de Pendente "' + atendimento.id);
});
exports.finalizarAtendimentoPendente = (atendimento_id) => __awaiter(void 0, void 0, void 0, function* () {
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    let tronco = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("update tb_atendimento set datahora_fim = '" + data + "', cliente_finalizou = 'False' where id = " + atendimento.id);
    yield atendimento_model_1.delAtendimento(atendimento);
    yield tronco.page.evaluate('sendMessageToId("' + atendimento.chave + '","Atendimento Finalizado com sucesso!");');
    logs_1.Log('Atendimento "' + atendimento.id + '" finalizado!');
});
//# sourceMappingURL=atendimentos-pendentes.js.map