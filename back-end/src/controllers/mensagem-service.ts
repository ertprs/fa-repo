import { getRemetenteById } from "./../models/remetente-model";
import { database } from './../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Atendimento, getAtendimentoByChaveRemetenteId } from './../models/atendimento-model';
import { io } from "./../libs/io";


export const updateMessagesId = async (mensagens: any[], remetente_id: number) => {
    let contato = mensagens[0].contactId;
    let remetente = await getRemetenteById(remetente_id);

    let dadoCliente: any = await database.query("select * from tb_cliente where empresa_id = " + remetente.empresa_id + " and whatsapp_id = '" + contato + "' limit 1");
    if (dadoCliente![0]![0]) {
        let cliente_id = dadoCliente[0][0].id;
        for (let index = 0; index < mensagens.length; index++) {
            const mensagem = mensagens[index];
            await database.query("update tb_mensagem set whatsapp_id = '" + mensagem.id + "' where " +
                "empresa_id = " + remetente.empresa_id + " and origem = 'AGENTE' and origem_id <> " + cliente_id + " and whatsapp_id is null order by id limit 1");
        }
    }

    let fone = mensagens[0].contactId.substring(0, mensagens[0].contactId.indexOf('@'));
    if (fone.length == 12) fone = fone.substring(0, 4) + '9' + fone.substring(4);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_whatsapp_mensagens set status = 'ENVIADA', mensagem_id = '" + mensagens[0].id + "', entregue = " +
        (mensagens[0].ack > 0 ? "1" : "0") + ", datahora_entregue = " + (mensagens[0].ack > 0 ? "'" + data + "'" : "null") +
        " where destino = '" + fone + "' and remetente_id = " + remetente.id + " and mensagem_id is null  limit 1");
}

export const updateStatusMensagem = async (evento: any) => {
    let mensagemId = evento.id.id;

    let dt = dataTempo.create(new Date(evento.t * 1000));
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_whatsapp_mensagens set status = 'ENVIADA', entregue = " +
        (evento.ack > 0 ? "1" : "0") + ", datahora_entregue = " + (evento.ack > 0 ? "'" + data + "'" : "null") +
        " where mensagem_id = '" + mensagemId + "'");
}

export const updateMediaMensagem = async (evento: any, remetente_id: number) => {
    //pegando o atm
    var atendimento = await getAtendimentoByChaveRemetenteId(evento.data.contactId, remetente_id);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    let sMsgText: String = '';
    // if (!atendimento) {
    //     updateMediaMensagem(evento, remetente_id);
    // } 

    // const sleep = (milliseconds) => {
    //     return new Promise(resolve => setTimeout(resolve, milliseconds))
    //   }

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds){
            break;
          }
        }
    }

    // VERIFICAÇÃO EM LOOP PARA UPDATE DE MSG (VERIFICA 5 VEZES ANTES DE LIBERAR)
    let tentativas = 1;
    if (evento.data.type == 'image' || evento.data.type == 'ptt' || evento.data.type == 'document') {
        while (tentativas <= 10) {
            console.log('Tentativa: '+tentativas +' - MSG: '+evento.data.id+' ##############################');
            let existMsg = await database.query("select id, mensagem from tb_mensagem where whatsapp_id = '"+evento.data.id+"';");
            
            if (!existMsg[0][0]) {
                tentativas++;
                sleep(1000);
            } else { 
                tentativas = 11;
                sMsgText = existMsg[0][0].mensagem;
            }    
            
        }
    }



    console.log('evento.data.type', evento.data.type)

    if (evento.data.type == 'image') {
        console.log('salvando imagem: ',evento.data.id);
        await database.query("update tb_mensagem set base64file = '"+evento.data.url+"', type_mensagem = 'image' where whatsapp_id = '"+evento.data.id+"'");

        //enviando arquivo de imagem
        if (atendimento) {
            if (atendimento.datahora_atendimento) {
                io.emit('receiveMsg', JSON.stringify({
                    usuario_id: (atendimento.agente_id ? atendimento.agente_id : null),
                    cliente_id: atendimento.cliente.id,
                    atendimento_id: atendimento.id,
                    protocolo: atendimento.protocolo,
                    intervencao: (atendimento.intervencao ? atendimento.intervencao : 'False'),
                    mensagem_id: evento.data.id,
                    datahora_envio: data,
                    mensagem: sMsgText,
                    empresa_id: atendimento.empresa_id,
                    nome_cliente: atendimento.nome,
                    type_mensagem:'image',
                    base64file: evento.data.url
                }));
            }
        }
    } 
    
    if (evento.data.type == 'ptt') { 
        console.log('salvando audio: ',evento.data.id);
        await database.query("update tb_mensagem set base64file = '"+evento.data.url+"', type_mensagem = 'audio' where whatsapp_id = '"+evento.data.id+"'");

        //enviando arquivo de imagem
        if (atendimento) {
            if (atendimento.datahora_atendimento) {
                io.emit('receiveMsg', JSON.stringify({
                    usuario_id: (atendimento.agente_id ? atendimento.agente_id : null),
                    cliente_id: (atendimento.cliente.id ? atendimento.cliente.id : null),
                    atendimento_id: atendimento.id,
                    protocolo: atendimento.protocolo,
                    intervencao: (atendimento.intervencao ? atendimento.intervencao : 'False'),
                    mensagem_id: evento.data.id,
                    datahora_envio: data,
                    mensagem: '',
                    empresa_id: atendimento.empresa_id,
                    nome_cliente: atendimento.nome,
                    type_mensagem:'audio',
                    base64file: evento.data.url
                }));
            }
        }
    }  
    
    if (evento.data.type == 'document') { 
        console.log('salvando documento: ',evento.data.id);
        await database.query("update tb_mensagem set base64file = '"+evento.data.url+"', type_mensagem = 'docs', mensagem = 'Arquivo Enviado... <br>' where whatsapp_id = '"+evento.data.id+"'");

        //enviando arquivo de imagem
        if (atendimento) {
            if (atendimento.datahora_atendimento) {
                io.emit('receiveMsg', JSON.stringify({
                    usuario_id: (atendimento.agente_id ? atendimento.agente_id : null),
                    cliente_id: atendimento.cliente.id,
                    atendimento_id: atendimento.id,
                    protocolo: atendimento.protocolo,
                    intervencao: (atendimento.intervencao ? atendimento.intervencao : 'False'),
                    mensagem_id: evento.data.id,
                    datahora_envio: data,
                    mensagem: 'Arquivo Enviado... <br>',
                    empresa_id: atendimento.empresa_id,
                    nome_cliente: atendimento.nome,
                    type_mensagem:'docs',
                    base64file: evento.data.url
                }));
            }
        }
    } 

   
    // if (evento.data.type == 'image' || evento.data.type == 'ptt' || evento.data.type == 'document') {
    //     let existMsg = await database.query("select * from tb_mensagem where whatsapp_id = '"+evento.data.id+"' and base64file is not null");
    //     if (!existMsg[0][0]) {
    //         console.log('nao tenho a msg de midia');
    //         updateMediaMensagem(evento, remetente_id);
    //     }
    // }
      
}

                                    //novos campos: base64file file_name type_file exists_image exists_document
export const gravaMensagem = async (
    atendimento: Atendimento, 
    origem: string, 
    mensagem: string, 
    mensagem_id: string, 
    msg_agent_id: number,
    pData: string,
    base64file: string,
    file_name: string,
    type_file: string,
    exists_image: string,
    exists_document: string,
    type_mensagem: string,
    quotedMessage: string
) => {
    let remetente = await getRemetenteById(atendimento.remetente_id);
    if (!remetente.page && atendimento.tipo == 'WHATSAPP') return;
    let data
    // if (type_mensagem == 'texto' && mensagem) {
    if (mensagem) {
        mensagem = mensagem.replace(/\\/g, '\\\\');
        mensagem = mensagem.replace(/'/g, '');
    }
        
    if (!pData) {
        let dt = dataTempo.create();
        data = dt.format('Y-m-d H:M:S');
    } else {
        data = pData;
    }

    let montaBase64 = 'data:';
    montaBase64 = montaBase64+(exists_document == 'True' ? (type_file == 'txt' ? 'text/plain' : 'application/') : 'image/');
    montaBase64 = montaBase64+(type_file == 'txt' ? '' : 
            (type_file == 'xlsx' ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
            (type_file == 'docx' ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' : 
            (type_file == 'jpg' ? 'jpeg' : type_file))));
    montaBase64 = montaBase64+';base64,';
    // console.log('type_file: ',type_file)
    // console.log(montaBase64);

    let base64FileOn = (base64file ? montaBase64+base64file : '');

    if (!base64file) {
        await database.query("insert into tb_mensagem (atendimento_id, origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id, file_name, type_file, exists_image, " +
        " exists_document, type_mensagem) values (" + atendimento.id + "," + "'" + origem + "', " + (origem == 'CLIENTE' ? atendimento.cliente.id : msg_agent_id) + ", " +
        "'" + data + "','" + (mensagem ? mensagem+' <br>' : '') + "', " + atendimento.empresa_id + ", '" + mensagem_id + "', " + (origem == 'CLIENTE' ? "'" + mensagem_id + "'" : "NULL") + ", " +
        " '" + file_name + "', '" + type_file + "', '" + exists_image + "', '" + exists_document + "', '"+type_mensagem+"')");
    } else {
        await database.query("insert into tb_mensagem (atendimento_id, origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id, base64file, file_name, type_file, exists_image, " +
        " exists_document, type_mensagem) values (" + atendimento.id + "," + "'" + origem + "', " + (origem == 'CLIENTE' ? atendimento.cliente.id : msg_agent_id) + ", " +
        "'" + data + "','" + (mensagem ? mensagem+' <br>' : '') + "', " + atendimento.empresa_id + ", '" + mensagem_id + "', " + (origem == 'CLIENTE' ? "'" + mensagem_id + "'" : "NULL") + ", " +
        " '" + base64FileOn + "',  '" + file_name + "', '" + type_file + "', '" + exists_image + "', '" + exists_document + "', '"+type_mensagem+"')");
    }
    

        // console.log('gravou a mensagem: ', atendimento);
    if (origem == 'CLIENTE') {
        //testar numero de atendimento no usuario; 
        if (atendimento.datahora_atendimento == null || atendimento.datahora_atendimento == undefined) {
            // console.log('nao enviar mensagem');
        } else {
            if(mensagem) {
                let newMensagem = '';
                if (atendimento.tipo == 'WHATSAPP') {
                    mensagem = mensagem.replace(/&/g, '&amp;').replace(/“/g, '&quot;').replace(/”/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
                    if (quotedMessage != 'null') {
                        let refenceMsg = quotedMessage.split('$$$$');
                        newMensagem += '<section style=\"padding: 10px; padding-bottom: 5px; background-color: lightgray; border-left: 5px solid #0465ac; border-radius: 5px; margin-bottom: 5px;\">'+
                        '<span style=\"font-size: 12px; color: #993300; margin-bottom: 5px;\"><strong>Referente: '+refenceMsg[1]+'</strong></span>'+
                        '<br><span style=\"font-size: 12px;\"> '+refenceMsg[0]+'</span></section>';
                    }//fromId
                    
                    newMensagem +=mensagem+' <br>';
                    // mensagem += ' <br>';
                    await database.query("update tb_mensagem set mensagem = '"+newMensagem+"' where mensagem_id = '"+mensagem_id+"' and whatsapp_id  = '"+mensagem_id+"'");
                }
                //corrigi erro acesso violation
                console.log('saber mensagem: ( ',mensagem +' ) Tipo: '+type_mensagem);

                if(type_mensagem != 'image'){
                    io.emit('receiveMsg', JSON.stringify({
                        usuario_id: atendimento.agente_id,
                        cliente_id: atendimento.cliente.id,
                        atendimento_id: atendimento.id,
                        protocolo: atendimento.protocolo,
                        intervencao: (atendimento.intervencao ? atendimento.intervencao : 'False'),
                        mensagem_id: mensagem_id,
                        datahora_envio: data,
                        mensagem: (newMensagem ? newMensagem : mensagem),
                        empresa_id: atendimento.empresa_id,
                        nome_cliente: atendimento.nome,
                        type_mensagem: 'texto',
                        base64file: ''
                    }));
                }
                
            } else console.log('msg vazia: ',mensagem);
        }        
    } else {
        if (atendimento.tipo == 'WHATSAPP') {            
            if (msg_agent_id != 0) {
                console.log('entrou na msg service')
                //VERIFICAR SE MSG DE IMG OU FILE
                if (exists_image == 'False' && exists_document == 'False') {
                    // console.log('deu certo msg texto: ',mensagem);
                    console.log('atm chave: ',atendimento.chave);
                    mensagem = mensagem.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&apos;/g, "\\'").replace(/<br>/g, '\\n').replace(/&quot;/g, '"');
                    if (atendimento.chave == 'ChaveFalse') {
                        // console.log('atm numero chave: ',atendimento.cliente.telefone);
                        await remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","' + mensagem + '");');
                    } else
                        await remetente.page.evaluate("sendMessageToId('" + atendimento.chave + "','" + mensagem + "');");
                } else if (exists_image == 'True') {
                    // await remetente.page.evaluate('sendBase64MediaToNumber("' + atendimento.numero + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "image/' + type_file + '", "");');
                    if (atendimento.chave == 'ChaveFalse') {
                        // console.log('atm numero chave: ',atendimento.cliente.telefone);
                        await remetente.page.evaluate('sendBase64MediaToNumber("' + atendimento.cliente.telefone + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "image/' + type_file + '", "");');
                    } else
                        // console.log('sendBase64MediaToId("' + atendimento.chave + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "image/' + type_file + '", "");');
                        await remetente.page.evaluate('sendBase64MediaToId("' + atendimento.chave + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "image/' + type_file + '", "");');
                } else if (exists_document == 'True') {
                    if (atendimento.chave == 'ChaveFalse') {
                        // console.log('atm numero chave: ',atendimento.cliente.telefone);
                        await remetente.page.evaluate('sendBase64MediaToNumber("' + atendimento.cliente.telefone + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "", "");');
                    } else
                        await remetente.page.evaluate('sendBase64MediaToId("' + atendimento.chave + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + file_name + '", "", "");');
                }

                if (atendimento.chave == 'ChaveFalse') {
                    // console.log('retorno numero chave: ',atendimento.cliente.telefone);
                    // await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.cliente.telefone + "');");
                } else
                    await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
            }            
        } else {
            mensagem = mensagem.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&apos;/g, "\\'").replace(/<br>/g, '\n');
            
            io.emit('msgReceived', {
                id: atendimento.chave,
                msg: mensagem,
                tipo: 'AGENTE',
                data: new Date()
            });            
        }
    }
}
