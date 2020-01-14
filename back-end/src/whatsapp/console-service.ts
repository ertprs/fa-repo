
import { database } from './../libs/conexao';
import { io } from './../libs/io';
import { updateMessagesId, updateStatusMensagem, updateMediaMensagem } from './../controllers/mensagem-service';
import { Remetente, getRemetenteById } from './../models/remetente-model';
import { Log } from './../globais/logs';
import { updateRemetente } from './../controllers/remetente-controller';
import { analisaMensagens } from './mensagem-service';
import { qrcodechanged } from './qrcodechanged';
import { updateContatoValido } from './updateContatoValido';
import { status } from './statusWA';

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


export const CheckEvent = async (evento, remetente_id: number) => {

    // Evendo de monitoria do telefone, bateria e outros
    if (evento.href == '/monitoring' && evento.monitoring_phone) {
        let remetente: Remetente = await getRemetenteById(remetente_id);
        if (remetente) {
            await updateRemetente(remetente, evento);
        }
        return;
    }

    // Evendo de status do telefone, bateria e outros (completo) (Evento solicitado pela função: getStatusJson())
    if (evento.href == '/status') {
        await status(evento, remetente_id);
        return;
    }

    // Evento de chagada de Mensagem
    if (evento.href == '/monitoring' && evento.messages.length > 0) {
        await analisaMensagens(evento.messages, remetente_id);
        return;
    }

    // Evento de chegada e atualização de mensagens (Evento solicitado pela função: getLocalUnreadMessagesFromContactIdJson)
    if (evento.href == '/' && evento.messages && evento.messages.length > 0) {
        await updateMessagesId(evento.messages, remetente_id);
        return;
    }

    // Evento de chegada de midia das mensagens (Evento solicitado pela função: getLocalUnreadMessagesFromContactIdJson)
    if (evento.href == '/updatemedia') {
        await updateMediaMensagem(evento, remetente_id);
        return;
    }

    // Evento não definido (Tohen: Não sei do que se trata)
    if (evento.href == '/wamessagebyid' && evento.status) {
        await updateStatusMensagem(evento.status);
        Log('Evento não definido\n Remetente: ' + remetente_id + '\n' + JSON.stringify(evento));
        return;
    }

    // Evento de chegada do QR Code de validação
    if (evento.href == '/qrcodechanged') {
        await qrcodechanged(evento, remetente_id);
        return;
    }

    // Evento que atualiza o contato (Tohen: Não sei se funciona, ou se foi de uma outra versão)
    if (evento.href == '/contactexist') {
        await updateContatoValido(remetente_id, evento.number, evento.exist);
        return;
    }

    Log('Evento não tratado\n Remetente: ' + remetente_id + '\n' + JSON.stringify(evento));

}

