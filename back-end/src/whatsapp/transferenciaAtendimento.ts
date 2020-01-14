import { database } from './../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Log } from './../globais/logs';
import { 
    getAtendimentoById, 
    addAtendimento, 
    Atendimento,
    delAtendimento
} from "./../models/atendimento-model";
import { getRemetenteById } from "./../models/remetente-model";
import { 
    finalizaAtendimento, 
    iniciaAtendimento, 
    updateDataHoraFilaAtendimento, 
    checkAgenteDisponivel,
    setAgenteAtendimento
} from './../controllers/atendimento-controller';
// import { iniciaAtendimentoWA } from './iniciaAtendimentoWA';
import { gravaMensagem } from './../controllers/mensagem-service';
import { getAgenteById } from './../models/agente-model';

export const transferenciaAtendimento = async (
    atendimento_id: number,
    agente_transferencia_id: number,
    grupo_id: number,
    remetente_id,
    socket 
) => {
    let dt = dataTempo.create();
    let atendimento = await getAtendimentoById(atendimento_id);
    let data = dt.format('Y-m-d H:M:S');
    console.log('### Trans: 1');
    
    if (atendimento){
        if (!atendimento.datahora_inicio){
            atendimento.datahora_inicio = data;
        }
    
        if (!atendimento.datahora_fila){
            atendimento.datahora_fila = data;
        }
    
        if (!atendimento.datahora_atendimento){
            atendimento.datahora_atendimento = data;
        }
    }
    

    await finalizaAtendimento(atendimento, false);
    console.log('### Trans: 2');
    console.log('grava arquivo atendimento transferencia na tb atm_tranfer');
    await database.query("insert into tb_atendimento_transferencia (empresa_id, atendimento_id, agente_id, agente_transferencia_id, remetente_id, grupo_id, datahora_transferencia) values (" +
    atendimento.empresa_id + ", " + atendimento.id + ", " + atendimento.agente_id + ", " + (agente_transferencia_id ? agente_transferencia_id : null) + ", " + remetente_id +
    ", " + grupo_id + ", '" + data + "');");

    console.log('### Trans: 3');

    var novoAtendimento: Atendimento = {
        id: 0,
        nome: atendimento.nome,
        protocolo: atendimento.protocolo,
        numero: atendimento.numero,
        avatar: atendimento.avatar,
        nivel: 0,
        empresa_id: atendimento.empresa_id,
        grupo_id: grupo_id,
        agente_id: (agente_transferencia_id ? agente_transferencia_id : null),
        remetente_id: remetente_id,
        datahora_inicio: data,
        datahora_fila: data,
        tipo: atendimento.tipo,
        chave: atendimento.chave,
        cliente: atendimento.cliente,
        preAtendimento: true,
        emEntendimento: false,
        ura_id: 0,
        tranfer_new: true,
        intervencao: 'False'
    };

    console.log('### Trans: 4');
    // await iniciaAtendimento(novoAtendimento);    

    // console.log('grava arquivo atendimento transferencia na tb atm');
    await database.query("insert into tb_atendimento (protocolo, datahora_inicio, datahora_fila, grupo_id, agente_id, empresa_id, tipo, cliente_id, remetente_id, cliente_chave) values ('" +
    atendimento.protocolo + "', '" + data + "', '" + data + "', " + grupo_id + ", " + (agente_transferencia_id ? agente_transferencia_id : null) + ", " + atendimento.empresa_id +
    ", '" + atendimento.tipo + "', " + atendimento.cliente.id + ", " + remetente_id + ", '" + atendimento.chave + "');");

    let atendimentoId: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
            "' and grupo_id = '" + novoAtendimento.grupo_id + "' order by id desc limit 1");
    // console.log('new mega id of the atendimento: ' + atendimentoId[0][0].id);
    novoAtendimento.id = atendimentoId[0][0].id; 

    //adiciona atm no array
    await addAtendimento(novoAtendimento);

    //inicia um novo atm
    // console.log('novo mega atm: ',novoAtendimento);
    // await iniciaAtendimentoWA(novoAtendimento);
    let remetente = await getRemetenteById(novoAtendimento.remetente_id);    
    await updateDataHoraFilaAtendimento(novoAtendimento.id);

    if (atendimento.chave == 'ChaveFalse') {
        await remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Seu Atendimento Está sendo transferido, aguarde o agente.");');
        // if (remetente.config.funcao_encerrar_atendimento != 'NAOEXISTEPALAVRA') {
        //     await remetente.page.evaluate('sendMessageToNumber("' + atendimento.cliente.telefone + '","Para encerrar o atendimento a qualquer momento digite: ' + remetente.config.funcao_encerrar_atendimento + '");');
        // }
    } else {
        await remetente.page.evaluate('sendMessageToId("' + novoAtendimento.chave + '","Seu Atendimento Está sendo transferido, aguarde o agente.");');
        // if (remetente.config.funcao_encerrar_atendimento != 'NAOEXISTEPALAVRA') {
        //     await remetente.page.evaluate('sendMessageToId("' + novoAtendimento.chave + '","Para encerrar o atendimento a qualquer momento digite: ' + remetente.config.funcao_encerrar_atendimento + ' ");');
        // }
    }
    
    //novos campos: base64file file_name type_file exists_image exists_document
    await gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel2_pergunta + ' ' + remetente.config.funcao_encerrar_atendimento, atendimento.chave, 0, null,'', '', '', 'False', 'False','texto', 'null');

    if (atendimento.chave == 'ChaveFalse') {
        // console.log('retorno numero chave: ',atendimento.cliente.telefone);
        // await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.cliente.telefone + "');");
    } else
        await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
        
    atendimento.nivel = 3;    

    if (novoAtendimento.agente_id && novoAtendimento.agente_id != 0) {
        let agente = await getAgenteById(novoAtendimento.agente_id);
        if (agente.qtdEmAtendimento < remetente.config.qtd_atendimento_simultaneo) {
            setAgenteAtendimento(agente, novoAtendimento);
        } else {
            novoAtendimento.agente_id = null;
            await checkAgenteDisponivel(novoAtendimento);
        }
    } else {
        await checkAgenteDisponivel(novoAtendimento);
    }

    // console.log('atm depois: ',atendimento);
}