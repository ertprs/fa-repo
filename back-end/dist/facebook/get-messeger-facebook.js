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
const remetente_model_1 = require("./../models/remetente-model");
const conexao_1 = require("./../libs/conexao");
const logs_1 = require("./../globais/logs");
const dataTempo = require("node-datetime");
const atendimento_model_1 = require("./../models/atendimento-model");
const tratar_pre_atendimento_1 = require("./tratar-pre-atendimento");
exports.getMessegerFacebook = (messeger) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('mensagem: ', messeger.messaging[0].message);
    console.log('mensagem id: ', messeger.id);
    // recebe as mensagens e verifica 
    let dt = dataTempo.create();
    //pegar o tronco 
    let tronco = yield remetente_model_1.getRemetenteByMyNumber(messeger.id);
    if (messeger.messaging[0].sender.id == tronco.mynumber)
        return;
    var atendimento = yield atendimento_model_1.getAtendimentoByChaveRemetenteId(messeger.messaging[0].sender.id, tronco.id);
    let transfer_atm = yield conexao_1.database.query("select * from tb_atendimento where cliente_chave = '" + messeger.messaging[0].sender.id + "' " +
        "and datahora_fim is null order by id desc limit 1");
    if (transfer_atm[0][0]) {
        // console.log('eu sou foda id atm: ',transfer_atm[0][0].id)
        atendimento = yield atendimento_model_1.getAtendimentoById(transfer_atm[0][0].id);
    }
    else {
        let temAtendimento = yield conexao_1.database.query("select count(*) as qtd from tb_atendimento a where a.cliente_chave = '" + messeger.messaging[0].sender.id + "' and a.datahora_fim " +
            "is not null and TIMESTAMPDIFF(second, a.datahora_fim, '" + dt.format('Y-m-d H:M:S') + "') < 60 order by  id desc limit 1");
        if (temAtendimento[0][0].qtd > 0)
            return logs_1.Log('Atendimentos anteriores');
    }
    if (atendimento) {
        if (!atendimento.preAtendimento) {
            // console.log('tratar o preatendimento');
            yield tratar_pre_atendimento_1.tratarPreAtendimentoFacebook(atendimento, messeger, tronco);
        }
        else {
            // trataraendimento
            // console.log('tratar o atendimento');
            // await tratarAtendimento(atendimento, mensagem,remetente_id);
        }
    }
    else {
        console.log('novo atm indo get user');
        let data = dt.format('Y-m-d H:M:S');
        var novoAtendimento = {
            id: 0,
            emEntendimento: false,
            // nome: messeger.messaging[0].sender.id,
            numero: messeger.messaging[0].sender.id,
            // avatar: message.avatarUrl,
            nivel: 0,
            empresa_id: tronco.empresa_id,
            grupo_id: tronco.grupo_id,
            remetente_id: tronco.id,
            datahora_inicio: data,
            tipo: 'FACEBOOK',
            chave: messeger.messaging[0].sender.id
        };
        yield atendimento_model_1.addAtendimento(novoAtendimento);
        // await getUserInfo(novoAtendimento,tronco);
        yield tratar_pre_atendimento_1.tratarPreAtendimentoFacebook(novoAtendimento, messeger, tronco);
    }
    logs_1.Log('Nova Mensagem | Remetente: ' + tronco.descricao + '| Origem: Facebook - ' + messeger.messaging[0].sender.id);
});
//# sourceMappingURL=get-messeger-facebook.js.map