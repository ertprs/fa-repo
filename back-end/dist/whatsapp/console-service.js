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
const mensagem_service_1 = require("./../controllers/mensagem-service");
const remetente_model_1 = require("./../models/remetente-model");
const logs_1 = require("./../globais/logs");
const remetente_controller_1 = require("./../controllers/remetente-controller");
const mensagem_service_2 = require("./mensagem-service");
const qrcodechanged_1 = require("./qrcodechanged");
const updateContatoValido_1 = require("./updateContatoValido");
const statusWA_1 = require("./statusWA");
// export const trataConsole = async (evento, remetente_id: number) => {
//     // console.log('eventos: ',evento);
//     if (evento.href == '/' && evento.messages && evento.messages.length > 0) {        
//         // console.log('evento.messages: ', evento.messages);
//         await updateMessagesId(evento.messages, remetente_id);
//     } else if (evento.href == '/wamessagebyid' && evento.status) {
//         await updateStatusMensagem(evento.status); 
//     } else if (evento.href == '/monitoring') {
//         //Informações do aparelho
//         if (evento.monitoring_phone) {
//             let remetente: Remetente = await getRemetenteById(remetente_id);
//             await updateRemetente(remetente, evento);
//         } else if (evento.messages.length > 0) {
//             // console.log('evento de receber msg: ',evento.messages[0]);
//             await analisaMensagens(evento.messages, remetente_id);
//         }
//     } else if (evento.href == '/updatemedia') {
//         // console.log('updatemedia TS: ',evento);
//         await updateMediaMensagem(evento, remetente_id);
//     } else if (evento.href == '/qrcodechanged') {
//         await qrcodechanged(evento, remetente_id);
//         // Log('QRCode! | Remetente: ' + remetente_id);
//         io.emit('qrcodechanged', JSON.stringify({ success: true, remetente_id: remetente_id }));
//     } else if (evento.href == '/status') {
//         await status(evento, remetente_id);
//     } else if (evento.href == '/contactexist') {
//         await updateContatoValido(remetente_id, evento.number, evento.exist);
//     } else {
//         console.log(evento);
//     }
// }
exports.CheckEvent = (evento, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    // Evendo de monitoria do telefone, bateria e outros
    if (evento.href == '/monitoring' && evento.monitoring_phone) {
        let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
        if (remetente) {
            yield remetente_controller_1.updateRemetente(remetente, evento);
        }
        return;
    }
    // Evendo de status do telefone, bateria e outros (completo) (Evento solicitado pela função: getStatusJson())
    if (evento.href == '/status') {
        yield statusWA_1.status(evento, remetente_id);
        return;
    }
    // Evento de chagada de Mensagem
    if (evento.href == '/monitoring' && evento.messages.length > 0) {
        yield mensagem_service_2.analisaMensagens(evento.messages, remetente_id);
        return;
    }
    // Evento de chegada e atualização de mensagens (Evento solicitado pela função: getLocalUnreadMessagesFromContactIdJson)
    if (evento.href == '/' && evento.messages && evento.messages.length > 0) {
        yield mensagem_service_1.updateMessagesId(evento.messages, remetente_id);
        return;
    }
    // Evento de chegada de midia das mensagens (Evento solicitado pela função: getLocalUnreadMessagesFromContactIdJson)
    if (evento.href == '/updatemedia') {
        yield mensagem_service_1.updateMediaMensagem(evento, remetente_id);
        return;
    }
    // Evento não definido (Tohen: Não sei do que se trata)
    if (evento.href == '/wamessagebyid' && evento.status) {
        yield mensagem_service_1.updateStatusMensagem(evento.status);
        logs_1.Log('Evento não definido\n Remetente: ' + remetente_id + '\n' + JSON.stringify(evento));
        return;
    }
    // Evento de chegada do QR Code de validação
    if (evento.href == '/qrcodechanged') {
        yield qrcodechanged_1.qrcodechanged(evento, remetente_id);
        return;
    }
    // Evento que atualiza o contato (Tohen: Não sei se funciona, ou se foi de uma outra versão)
    if (evento.href == '/contactexist') {
        yield updateContatoValido_1.updateContatoValido(remetente_id, evento.number, evento.exist);
        return;
    }
    logs_1.Log('Evento não tratado\n Remetente: ' + remetente_id + '\n' + JSON.stringify(evento));
});
//# sourceMappingURL=console-service.js.map