import { Atendimento } from './../models/atendimento-model';
import { 
    // checkClienteWA, 
    updateDataHoraFilaAtendimento, 
    checkAgenteDisponivel, 
    removeAgenteAtendimento 
} from './../controllers/atendimento-controller';
import { checkNumero, getPeriodoDia } from './../globais/funcs';
import { getRemetenteById } from './../models/remetente-model';
import { gravaMensagem } from './../controllers/mensagem-service';
import * as dataTempo from 'node-datetime';

export const iniciaAtendimentoWA = async (atendimento: Atendimento) => {
    let remetente = await getRemetenteById(atendimento.remetente_id);
    // await checkClienteWA(atendimento);
    // let data = new Date();
    
    // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
    //     checkNumero(data.getDate()).toString() + atendimento.cpf.substring(0, 4) + checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
    //     + checkNumero(data.getSeconds()).toString();
    // atendimento.grupo_id = remetente.grupo_id;
    console.log('em atendimento bool: ' + atendimento.preAtendimento);
    if (atendimento.preAtendimento == false || atendimento.preAtendimento == undefined)
    {
        // console.log('entrei no atm wa ...')
        let dt = dataTempo.create();
        let data = dt.format('Y-m-d H:M:S');
        atendimento.preAtendimento = true;
        atendimento.datahora_fila = (atendimento.datahora_fila ? atendimento.datahora_fila : data);
        await updateDataHoraFilaAtendimento(atendimento.id);
        if (atendimento.ura_id == null) {
            // verificar se a saudação esta permitida 
            if (remetente.config.enviar_saudacao_cliente == 'True') {
                await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + getPeriodoDia() + '! ' + remetente.config.msg_boot_nivel1_pergunta.replace('{cliente}', atendimento.nome).replace('{grupo}', remetente.grupo_nome) + (remetente.config.cpf_obrigatorio == 1 ? ' Por favor, informe seu CPF.' : '') + '");');
            }
            // end saudação permitida
            await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_boot_nivel2_pergunta + ' ");');
            if (remetente.config.permitir_protocolo == 'True')
                await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","O número de protocolo do seu atendimento é: ' + atendimento.protocolo + '");');
        } else {
            await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_boot_nivel2_pergunta + ' ");');
            //novos campos: base64file file_name type_file exists_image exists_document
            await gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel2_pergunta, atendimento.chave, 0, null,'', '', '', 'False', 'False','texto', 'null');
        }
        await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
        atendimento.nivel = 3;

        await checkAgenteDisponivel(atendimento);
        // console.log('tranferiu o atendimento');
    }
}
