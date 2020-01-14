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
const agentes = [];
exports.getAgentes = () => __awaiter(void 0, void 0, void 0, function* () {
    return agentes;
});
exports.getAgenteById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return agentes.find(x => x.id == id);
});
exports.getAgenteBySocket = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    return agentes.find(x => x.socket == socket);
});
exports.getAgentesByGrupoId = (grupo_id) => __awaiter(void 0, void 0, void 0, function* () {
    // return agentes.filter(x => x.grupo_id == grupo_id).sort(function(a,b) {return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0;});
    return agentes.filter(x => x.grupo_id == grupo_id);
});
exports.getAgentesByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return agentes.filter(x => x.empresa_id == empresa_id).sort(function (a, b) { return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0; });
});
exports.getAgentForSetAtt = (empresa_id, qtd_max) => __awaiter(void 0, void 0, void 0, function* () {
    return agentes.filter(x => x.empresa_id == empresa_id && x.qtdEmAtendimento < qtd_max).sort(function (a, b) { return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0; });
});
exports.addAgente = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    agentes.push(agente);
});
exports.delAgente = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    let id = agente.id;
    for (let index = 0; index < agentes.length; index++) {
        const age = agentes[index];
        if (age.id == id) {
            agentes.splice(index, 1);
            logs_1.Log('Agente "' + id + '" removido na lista!');
        }
    }
});
//# sourceMappingURL=agente-model.js.map