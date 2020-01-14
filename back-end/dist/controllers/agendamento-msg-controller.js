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
const agendamento_msg_model_1 = require("./../models/agendamento-msg-model");
exports.removeAgendamentoMsg = (agendamentoMsg) => __awaiter(void 0, void 0, void 0, function* () {
    let listAgendamentoMsg = yield agendamento_msg_model_1.getAgendamentoMsgById(agendamentoMsg.id);
});
exports.adicionarAgendamentoMsg = (agendamentoMsg) => __awaiter(void 0, void 0, void 0, function* () {
    let adAgendamentoMsg = yield agendamento_msg_model_1.addAgendamentoMsg(agendamentoMsg);
});
exports.checkAgendamentoMsg = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    let agendamentosMsg = yield agendamento_msg_model_1.getAgendamentoMsg();
});
//# sourceMappingURL=agendamento-msg-controller.js.map