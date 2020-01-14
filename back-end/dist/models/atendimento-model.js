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
const logs_1 = require("./../globais/logs");
const charts_model_1 = require("./charts-model");
const atendimentos = [];
exports.getAtendimentos = () => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos;
});
exports.getAtendimentoByTrontoId = (remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(x => x.remetente_id == remetente_id);
});
exports.getAtendimentoById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.find(x => x.id == id);
});
exports.getAtendimentosByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(atm => atm.empresa_id == empresa_id);
});
exports.getAtendimentosByAgenteId = (agente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(x => x.agente_id == agente_id);
});
exports.getAtendimentosNaoAtendidos = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(x => (!x.agente_id || x.agente_id == 0) && x.empresa_id == empresa_id);
});
exports.getTodosAtendimentosNaoAtendidos = () => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(x => (!x.agente_id || x.agente_id == 0));
});
exports.getAtendimentosEmUra = () => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.filter(x => ((!x.agente_id || x.agente_id == 0) && (!x.datahora_fila && !x.datahora_atendimento)));
});
exports.getAtendimentoByChave = (chave, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.find(x => x.chave == chave);
});
exports.getAtendimentoByNumeroTronco = (numero, tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.find(x => (x.cliente ? x.cliente.telefone == numero && x.remetente_id == tronco_id : x.numero == numero && x.remetente_id == tronco_id));
});
exports.getAtendimentoByChaveRemetenteId = (chave, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.find(x => x.chave == chave && x.remetente_id == remetente_id);
});
exports.getAtendimentoByCPF = (cpf) => __awaiter(void 0, void 0, void 0, function* () {
    return atendimentos.find(x => x.cpf == cpf);
});
exports.addAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    atendimentos.push(atendimento);
    logs_1.Log('Atendimento "' + atendimento.id + '" adicionado na lista!');
});
exports.delAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let id = atendimento.id;
    for (let index = 0; index < atendimentos.length; index++) {
        const atend = atendimentos[index];
        if (atend.id == id) {
            yield charts_model_1.acGenChartCard(atend);
            atendimentos.splice(index, 1);
            logs_1.Log('Atendimento "' + id + '" removido na lista!');
        }
    }
});
//# sourceMappingURL=atendimento-model.js.map