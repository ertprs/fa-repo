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
const io_1 = require("./../libs/io");
const agente_model_1 = require("./../models/agente-model");
const remetente_model_1 = require("./../models/remetente-model");
const funcs_1 = require("../globais/funcs");
const atendimento_model_1 = require("../models/atendimento-model");
const charts_model_1 = require("../models/charts-model");
exports.sendDashBoardAgentes = () => __awaiter(void 0, void 0, void 0, function* () {
    let remetentes = yield remetente_model_1.getRemetentes();
    let empresas = yield funcs_1.acGroupBy('empresa_id', remetentes);
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let agentes = [];
        let agents_list = yield agente_model_1.getAgentesByEmpresaId(empresa.empresa_id);
        for (let index = 0; index < agents_list.length; index++) {
            const item = agents_list[index];
            const agente = {
                usuario_id: item.id,
                nome: item.nome,
                empresa_id: item.empresa_id,
                grupo_id: item.grupo_id,
                grupo_nome: item.grupo_nome,
                qtd_atendimentos: item.qtdEmAtendimento,
                atendidos: item.qtdAtendimentos,
                qtd_intervencoes: 0
            };
            agentes.push(agente);
        }
        io_1.io.emit('sendEstatisticasAgente', empresa.empresa_id, agentes);
    }
});
exports.sendDashBoardCards = () => __awaiter(void 0, void 0, void 0, function* () {
    let remetentes = yield remetente_model_1.getRemetentes();
    let empresas = yield funcs_1.acGroupBy('empresa_id', remetentes);
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let atendimentos = yield atendimento_model_1.getAtendimentosByEmpresaId(empresa.empresa_id);
        let atm_ura = atendimentos.filter(atm => !atm.datahora_fila);
        let atm_fila = atendimentos.filter(atm => atm.datahora_fila && !atm.datahora_atendimento);
        let atm_atendimento = atendimentos.filter(atm => atm.datahora_fila && atm.datahora_atendimento && atm.agente_id > 0);
        let atm_pendente = atendimentos.filter(atm => atm.datahora_fila && atm.datahora_atendimento && (atm.agente_id == 0 || atm.agente_id == null));
        let TMatendimento = '00:00:00';
        let TMfila = '00:00:00';
        let TMUra = '00:00:00';
        let qtd = 0;
        let atendidas = 0;
        let abandonos = 0;
        let card = yield charts_model_1.acGetCardByEmpresaID(empresa.empresa_id);
        if (card) {
            TMatendimento = card.TMatendimento;
            TMfila = card.TMfila;
            TMUra = card.TMUra;
            qtd = Math.floor(card.atendidos + card.abandonados);
            atendidas = card.atendidos;
            abandonos = card.abandonados;
        }
        let stats = {
            em_atendimento: atm_atendimento.length,
            em_fila: atm_fila.length,
            em_ura: atm_ura.length,
            pendentes: atm_pendente.length,
            TMatendimento: TMatendimento,
            TMfila: TMfila,
            TMUra: TMUra
        };
        io_1.io.emit('sendEstatisticasCards', empresa.empresa_id, stats);
        io_1.io.emit('sendEstatisticasGrafico', empresa.empresa_id, { qtd: qtd, atendidas: atendidas, abandonos: abandonos });
    }
});
//# sourceMappingURL=fns-AdmDashBoard.js.map