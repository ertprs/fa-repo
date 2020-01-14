
import { Atendimento } from '../models/atendimento-model';
import { getRemetenteById } from '../models/remetente-model';
import { finalizaAtendimento } from '../controllers/atendimento-controller';
import { gravaMensagem } from './../controllers/mensagem-service';
import { horarioFuncionamento } from './../controllers/horario-funcionamento-controller';

export const tratarAtendimento = async (atendimento: Atendimento, mensagem, remetente_id) => {
    let remetente = await getRemetenteById(remetente_id);
    

    //### VERIFICAR HORARIO DE FUNCIONAMENTO ###
    let horariosFuncionamentos: any = await horarioFuncionamento(remetente_id);
    console.log('horariosFuncionamentos: ',horariosFuncionamentos);

    if (horariosFuncionamentos.status == false) {
        console.log('Não está dentro do horário: ',horariosFuncionamentos);
        //gravar mensgem
        if (mensagem.messages[0].type == 'chat') {
            await gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null,'', '', '', 'False', 'False','texto','null');
        } else if (mensagem.messages[0].type == 'image') {
            await gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null,'', '', '', 'False', 'False','image','null');
        } else {
            await gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null,'', '', '', 'False', 'False','texto','null');
        }
        //envio de mensagem fora do horario
        await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + horariosFuncionamentos.data.mensagem + '" );');
        return ;
    }

    for (let index = 0; index < mensagem.messages.length; index++) {
        const msg = mensagem.messages[index];
        let type_mensagem: string = 'texto';

        if (msg.type == 'image') {
            type_mensagem = 'image';
        }

        if(msg.message) {
            let quotedMessage = 'null';
            if (msg.quotedMessage) {
                if (msg.quotedMessage.type == 'chat') {
                    // quotedMessage = msg.quotedMessage.message;
                    let fromId = msg.quotedMessage.fromId.split("@");
                    quotedMessage = msg.quotedMessage.message+'$$$$'+fromId[0];
                }   
            }
            if (msg.message.trim().toUpperCase() == remetente.config.funcao_encerrar_atendimento.toUpperCase()) {
                await finalizaAtendimento(atendimento, true);
                if (atendimento.chave == 'ChaveFalse') {
                    await remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Atendimento Finalizado com sucesso!");');
                } else {
                    await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","Atendimento Finalizado com sucesso!");');
                    await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
                }            
                return;
            } else {
                if (!atendimento.agente_id) {
                    console.log('att chave atm tratar '+atendimento.chave);
                    await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_nenhum_agente_disponivel + '");');
                    await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
                }
                //novos campos: base64file file_name type_file exists_image exists_document
                gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null,'', '', '', 'False', 'False',type_mensagem,quotedMessage);
            }
        } else {
            gravaMensagem(atendimento, 'CLIENTE', '', msg.id, 0, null,'', '', '','False','False',type_mensagem,'null');
        }  
    }

    
}