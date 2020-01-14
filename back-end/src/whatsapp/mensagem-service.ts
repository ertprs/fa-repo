import { 
    getAtendimentoByChave, 
    addAtendimento, 
    Atendimento,
    getAtendimentoByChaveRemetenteId,
    getAtendimentoById
} from "./../models/atendimento-model";
import { database } from './../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Log } from './../globais/logs';
import { getRemetenteById } from "./../models/remetente-model";
import { tratarPreAtendimento } from "./tratarPreAtendimento";
import { tratarAtendimento } from "./tratarAtendimento";
import { chamadasPerdidas } from "./chamadas-perdidas";
import { authenticateAtendimentoAndamento } from "./iniciar-atendimento/services/authenticate-atendimento-andamento";


export const analisaMensagens = async (mensagens: any[], remetente_id: number) => {
    console.log("FUNCTION: analisaMensagens: ##############################");
    let remetente = await getRemetenteById(remetente_id);
    let dt = dataTempo.create();
    for (let index = 0; index < mensagens.length; index++) {
        const mensagem = mensagens[index];
        let sMensagens = mensagem.messages;

        // Ignorar mensagem de grupo
        if (mensagem.isGroup == true) {
            return;
        }

        
        // Validação e remoção de mensagens de verificação
        for (let count = 0; count < sMensagens.length; count++) {
            const msg = sMensagens[count];

            if (msg.type == 'vcard') {
                //gravar no banco as opções de quem ligou
                msg.message = 'Contato: '+msg.vCard.FN[0].value+' - '+msg.vCard.TEL[0].value;
                msg.type = 'chat';
            }
    
            // ##### Tentativa de chamadas #####
            if (msg.type == 'call_log') {
                //gravar no banco as opções de quem ligou
                await chamadasPerdidas(mensagem, remetente);
                mensagem.messages.splice(count, 1);
            }
    
            // ##### Tentativa de chamadas #####
            if (msg.type == 'e2e_notification') {
                mensagem.messages.splice(count, 1);
            }
            
            // ##### Troca de numero telefonico #####
            if (msg.type == 'notification_template') {
                mensagem.messages.splice(count, 1);
            }

        }

        if(mensagem.messages.length <= 0){
            return;
        }

        // ##$## verificar atendimento iniciado pelo agente ##$##
        await authenticateAtendimentoAndamento(mensagem, remetente_id);
        
        for (let count = 0; count < mensagem.messages.length; count++) {
            const msg = mensagem.messages[count];

            // ##### BLACK LIST OF WORDS (LISTA NEGRA DE PALAVRAS) #####
            if (msg.message) {
                if (msg.message.trim().toUpperCase() == remetente.palavra_chave) {
                    console.log('e a palavra chave');

                    return ;
                }
            }
    
            // ### create the redirect of remetent ###
            if ((remetente.redirect) && remetente.impulsionar == 'True') {
                remetente = await getRemetenteById(remetente.redirect);
                remetente_id = remetente.redirect;
            }
    
   
            // var atendimento = await getAtendimentoByChave(mensagem.id);
            var atendimento = await getAtendimentoByChaveRemetenteId(mensagem.id, remetente.id);
    
            // console.log('atendimento: ' + atendimento);
    
            // GAMBIARRA MALDITA DO CARLOS (PELO QUE EU ENTENDI ISSO VERIFICA SE O CODIGO NA INICIALIZAÇÃO NO INICIALIZACAO.TS ESTÁ CORRETO)
            // let transfer_atm: any = await database.query("select * from tb_atendimento where cliente_chave = '" + mensagem.id + "' and remetente_id = "+remetente.id+" and datahora_fim is null order by id desc limit 1");
            // if (transfer_atm[0][0]) {
            //     atendimento = await getAtendimentoById(transfer_atm[0][0].id);
            // }
    
    
            if (atendimento) {
                if (!atendimento.preAtendimento) {
                    await tratarPreAtendimento(atendimento, mensagem, remetente.id);
                } else {
                    if (atendimento.datahora_fila) {
                        await tratarAtendimento(atendimento, mensagem,remetente_id);
                    } else {
                        atendimento.atm_ura_presa = true;   
                        await tratarPreAtendimento(atendimento, mensagem, remetente.id);
                    }                
                }
            } else {
                // console.log('new atm');
                let data = dt.format('Y-m-d H:M:S');
                var novoAtendimento: Atendimento = {
                    id: 0,
                    emEntendimento: false,
                    nome: (mensagem.profileName ? mensagem.profileName : mensagem.name).replace(/'/g, ''),
                    numero: mensagem.number,
                    avatar: mensagem.avatarUrl,
                    nivel: 0,
                    empresa_id: remetente.empresa_id,
                    grupo_id: remetente.grupo_id,
                    remetente_id: remetente.id,
                    datahora_inicio: data,
                    tipo: 'WHATSAPP',
                    chave: mensagem.id
                };
    
                await addAtendimento(novoAtendimento);
                await tratarPreAtendimento(novoAtendimento, mensagem, remetente.id);
            }
            Log('Nova Mensagem | Remetente: ' + remetente_id + '| Origem: ' + (mensagem.profileName ? mensagem.profileName : mensagem.name) + ' (' + mensagem.number + ')');
            return ;
            
        }

    }
}