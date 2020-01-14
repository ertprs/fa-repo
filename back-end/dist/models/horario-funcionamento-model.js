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
const horariosFuncionamentos = [];
exports.getHorariosFuncionamento = () => __awaiter(void 0, void 0, void 0, function* () {
    return horariosFuncionamentos;
});
exports.getHorariosFuncionamentoById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return horariosFuncionamentos.find(x => x.id == id);
});
exports.getHorariosFuncionamentoByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return horariosFuncionamentos.filter(x => x.empresa_id == empresa_id);
});
exports.getHorariosFuncionamentoByTroncoId = (tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    return horariosFuncionamentos.filter(x => x.tronco_id == tronco_id);
});
exports.addHorariosFuncionamento = (horarioFuncionamento) => __awaiter(void 0, void 0, void 0, function* () {
    horariosFuncionamentos.push(horarioFuncionamento);
    logs_1.Log('Horario de funcionamento adicionado com id: ' + horarioFuncionamento.id);
});
exports.delHorariosFuncionamento = (horarioFuncionamento) => __awaiter(void 0, void 0, void 0, function* () {
    let id = horarioFuncionamento.id;
    for (let index = 0; index < horariosFuncionamentos.length; index++) {
        const horaFunc = horariosFuncionamentos[index];
        if (horaFunc.id == id) {
            horariosFuncionamentos.splice(index, 1);
            logs_1.Log('Registro removido com sucesso, Horario de Funcionamento id: ' + id);
        }
    }
});
const datasFeriados = [];
exports.getDatasFeriados = () => __awaiter(void 0, void 0, void 0, function* () {
    return datasFeriados;
});
exports.getDatasFeriadosById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return datasFeriados.find(x => x.id == id);
});
exports.getDatasFeriadosByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return datasFeriados.filter(x => x.empresa_id == empresa_id);
});
exports.getDatasFeriadosByTroncoId = (tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    return datasFeriados.filter(x => x.tronco_id == tronco_id);
});
exports.addDatasFeriados = (datasFeriado) => __awaiter(void 0, void 0, void 0, function* () {
    datasFeriados.push(datasFeriado);
    logs_1.Log('Datas e Feriados adicionado com id: ' + datasFeriado.id);
});
exports.delDatasFeriados = (datasFeriado) => __awaiter(void 0, void 0, void 0, function* () {
    let id = datasFeriado.id;
    for (let index = 0; index < datasFeriados.length; index++) {
        const dataFeriado = datasFeriados[index];
        if (dataFeriado.id == id) {
            datasFeriados.splice(index, 1);
            logs_1.Log('Registro removido com sucesso, Data e Feriados id: ' + id);
        }
    }
});
//# sourceMappingURL=horario-funcionamento-model.js.map