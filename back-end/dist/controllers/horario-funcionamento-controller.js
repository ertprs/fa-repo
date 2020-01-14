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
const horario_funcionamento_model_1 = require("./../models/horario-funcionamento-model");
const horario_funcionamento_services_1 = require("./../services/horario-funcionamento-services");
const conexao_1 = require("./../libs/conexao");
const horario_funcionamento_model_2 = require("./../models/horario-funcionamento-model");
exports.horarioFuncionamento = (tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('tronco id agora: ',tronco_id);
    let diasHorarios = yield horario_funcionamento_model_1.getHorariosFuncionamentoByTroncoId(tronco_id);
    // console.log('diasHorarios: ',diasHorarios);
    if (diasHorarios) {
        let diaSemana = yield horario_funcionamento_services_1.getDiaSemana();
        // console.log('diaSemana: ',diaSemana);
        let diaHorario = yield diasHorarios.find(x => x.dia_semana == diaSemana);
        // console.log('diaHorario: ',diaHorario);
        if (!diaHorario)
            return {
                status: true,
                data: []
            };
        if (diaHorario.ativo == 'True') {
            //ver a hora
            let resp = yield horario_funcionamento_services_1.getHoraFuncionamento(diaHorario.hora_inicio, diaHorario.hora_fim);
            // console.log('resp: ',resp);
            if (resp) {
                return {
                    status: true,
                    data: []
                };
            }
            else {
                return {
                    status: false,
                    data: diaHorario
                };
            }
        }
        else {
            return {
                status: true,
                data: []
            };
        }
    }
    else {
        return {
            status: true,
            data: []
        };
    }
});
exports.insertHorarioFuncionamentoController = (params) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('params: ', params);
    let horarioFunc = yield conexao_1.database.query("select * from tb_horarios_funcionamentos where tronco_id = " + params.tronco_id + " and dia_semana = '" + params.dia_semana + "' ");
    yield horario_funcionamento_model_2.addHorariosFuncionamento(horarioFunc[0][0]);
});
exports.updateHorarioFuncionamentoController = (params) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('params: ', params);
    let horariosFunc = yield horario_funcionamento_model_2.getHorariosFuncionamentoById(params.id);
    horariosFunc.hora_inicio = params.hora_inicio;
    horariosFunc.hora_fim = params.hora_fim;
    horariosFunc.mensagem = params.mensagem;
    horariosFunc.ativo = params.ativo;
});
//# sourceMappingURL=horario-funcionamento-controller.js.map