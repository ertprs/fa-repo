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
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
const get_user_info_1 = require("./get-user-info");
const conexao_1 = require("./../libs/conexao");
exports.tratarPreAtendimentoFacebook = (atendimento, messeger, tronco) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('atm pre atm: ', atendimento);
    // tratar o pre-atendimento verificar a existencia da ura e mais...
    if (atendimento.controle_ura == undefined || atendimento.controle_ura == '' || atendimento.controle_ura == null) {
        //iniciar o atm antes de entrar na ura
        atendimento.controle_ura = 'exist';
        atendimento.cpf = '';
        // method of the check client
        yield get_user_info_1.getUserInfo(atendimento, tronco);
        let data = new Date();
        let sProtocolo = yield conexao_1.database.query("CALL sp_getprotocolo('" + atendimento.numero + "');");
        atendimento.protocolo = sProtocolo[0][0][0].protocolo;
        // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
        //     checkNumero(data.getDate()).toString() + (atendimento.cpf ? atendimento.cpf.substring(0, 4) : '') + 
        //     checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
        //     + checkNumero(data.getSeconds()).toString();
        atendimento = yield atendimento_model_1.getAtendimentoByChave(atendimento.chave);
        // console.log('atm depois get user: ', atendimento); 
        yield atendimento_controller_1.iniciaAtendimento(atendimento);
    }
    // ###### CREATE URA     messeger.messaging[0].message
    // const dadosUra: any = await reqListUraWA(tronco.empresa_id);
    // if (tronco.config.permitir_ura == 0) {
    //     console.log('nao tem ura ok');
    //     dadosUra[0][0] = '';
    // } 
    // if (dadosUra[0][0]) {
    //     //tem ura
    //     let msgUra = '';
    // } else {
    //     //nao tem
    //     console.log('grupo_id em remetente: ' + tronco.grupo_id);
    //     console.log('grupo_id em atendimento: ' + atendimento.grupo_id);
    //     await gravaMensagem(atendimento, 'CLIENTE', messeger.messaging[0], messeger.messaging[0].sender.id, 0, null,'', '', '', 'False', 'False', 'null');
    // }
});
//# sourceMappingURL=tratar-pre-atendimento.js.map