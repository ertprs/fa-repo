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
const agendamentoMsg = [];
exports.getAgendamentoMsg = () => __awaiter(void 0, void 0, void 0, function* () {
    return agendamentoMsg;
});
exports.getAgendamentoMsgById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return agendamentoMsg.find(x => x.id == id);
});
exports.getAgendamentoMsgByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return agendamentoMsg.filter(x => x.empresa_id == empresa_id);
});
exports.getAgendamentoMsgByRemetenteId = (remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return agendamentoMsg.filter(x => x.remetente_id == remetente_id);
});
exports.addAgendamentoMsg = (agendamentosMsg) => __awaiter(void 0, void 0, void 0, function* () {
    agendamentoMsg.push(agendamentosMsg);
    logs_1.Log('AgendamentoMsg "' + agendamentosMsg.id + '" adicionado na lista!');
});
exports.delAgendamentoMsg = (agendamentosMsg) => __awaiter(void 0, void 0, void 0, function* () {
    let id = agendamentosMsg.id;
    for (let index = 0; index < agendamentoMsg.length; index++) {
        const agend = agendamentoMsg[index];
        if (agend.id == id) {
            agendamentoMsg.splice(index, 1);
            logs_1.Log('AgendamentoMsg "' + id + '" removido na lista!');
        }
    }
});
//# sourceMappingURL=agendamento-msg-model.js.map