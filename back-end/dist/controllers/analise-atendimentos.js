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
const remetente_model_1 = require("./../models/remetente-model");
const atendimento_model_1 = require("./../models/atendimento-model");
const atendimento_controller_1 = require("./atendimento-controller");
const agente_model_1 = require("./../models/agente-model");
exports.AnaliseAtendimentosPendentes = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("FUNCTION: AnaliseAtendimentosPendentes: ##############################");
    let atendimentos = yield atendimento_model_1.getTodosAtendimentosNaoAtendidos();
    if (atendimentos) {
        for (let index = 0; index < atendimentos.length; index++) {
            const atendimento = atendimentos[index];
            let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
            let agentes = yield agente_model_1.getAgentForSetAtt(atendimento.empresa_id, remetente.config.qtd_atendimento_simultaneo);
            if (agentes) {
                if (remetente.config.permitir_ura == '0') {
                    yield atendimento_controller_1.setAgenteAtendimento(agentes[0], atendimento);
                }
                else {
                    if (atendimento.datahora_fila) {
                        let sArray_id = '';
                        for (let index = 0; index < agentes.length; index++) {
                            const agente = agentes[index];
                            let separador = '';
                            if (sArray_id == '') {
                                separador = '';
                            }
                            else {
                                separador = ',';
                            }
                            sArray_id = sArray_id + separador + agente.id;
                        }
                        if (sArray_id != '') {
                            let agtResult = yield conexao_1.database.query("select agente_id from tb_grupo_agente where agente_id in (" + sArray_id + ") and grupo_id = " + atendimento.grupo_id + " order by field(agente_id, " + sArray_id + ") limit 1");
                            if (agtResult[0][0]) {
                                let agente = yield agente_model_1.getAgenteById(agtResult[0][0].agente_id);
                                if (agente) {
                                    yield atendimento_controller_1.setAgenteAtendimento(agente, atendimento);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});
//# sourceMappingURL=analise-atendimentos.js.map