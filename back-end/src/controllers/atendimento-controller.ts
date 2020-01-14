
import { 
    Agente, 
    getAgentesByGrupoId, 
    getAgenteById, 
    delAgente,
    getAgentesByEmpresaId
} from './../models/agente-model';
import { 
    Atendimento, 
    getAtendimentosByAgenteId, 
    delAtendimento, 
    getAtendimentosNaoAtendidos, 
    getAtendimentoByCPF, 
    addAtendimento, 
    getAtendimentosByEmpresaId
} from './../models/atendimento-model';
import { database } from './../libs/conexao';
import { Log, LogErro, GetFileCode } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { 
    getRemetenteById, 
    getFirstRemetenteByEmpresaId 
} from './../models/remetente-model';
import { io } from './../libs/io';
import { gravaMensagem } from './mensagem-service';
import { agentePausa } from './agente-controller';
import { checkNumero } from './../globais/funcs';

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
}

export const removeAgenteAtendimento = async (agente: Agente) => {
    console.log('##### REMOÇÃO DO AGENTE '+agente.id+' DOS ATENDIMENTOS');
    let listaAtendimentos: any = await getAtendimentosByAgenteId(agente.id);
    for (let index = 0; index < listaAtendimentos.length; index++) {
        const atendimento: Atendimento = listaAtendimentos[index];
        // verificar se remove o agente de forma automatica ou manual
        let tronco = await getRemetenteById(atendimento.remetente_id);
        // se remove ou não agente do atendimento
        if (tronco.config.atendimento_fixo_agente == 'False') {
            if (tronco.config.remover_agente_atendimento == 'True') {
                Log('Inicio de espera de '+tronco.config.tempo_remover_agente_atendimento +' minuto para remoção do agente ' + agente.id + ' no atendimento ' + atendimento.id+'\n    File Info ( '+GetFileCode()+' )');
                
                await setTimeout(async () => {
                    // Log('Agente removido ' + agente.id + ' do atendimento ' + atendimento.id);
                    // ### verificar se agento logou se sim não faz nada ###
                    let existAgent = await getAgenteById(agente.id);
                    console.log('preciso ver agente ',existAgent)
                    if (!existAgent) {
                        let sAgente_id: number = atendimento.agente_id;
                        atendimento.agente_id = 0;
                        atendimento.emEntendimento = false;
                        await database.query("update tb_atendimento set agente_id = null where id = " + atendimento.id);
                        await database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + sAgente_id);
                        agente.qtdEmAtendimento--;
                        Log('Agente ' + agente.id + ' removido do atendimento ' + atendimento.id+'\n    File Info ( '+GetFileCode()+' )');
                        await checkAgenteDisponivel(atendimento);
                    }  
                }, tronco.config.tempo_remover_agente_atendimento  * 30000);


            } else {
                console.log('lista de pendentes');
                await setTimeout(async () => {
                    Log('Agente ' + agente.id + ' removido do atendimento ' + atendimento.id + ' inserindo atendimento nos pendentes. (Else)'+'\n    File Info ( '+GetFileCode()+' )');
                    let sAgente_id: number = atendimento.agente_id;
                    atendimento.agente_id = 0;
                    atendimento.emEntendimento = false;
                    await database.query("update tb_atendimento set agente_id = null where id = " + atendimento.id);
                    await database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + sAgente_id);
                    agente.qtdEmAtendimento--;
                    await checkAgenteDisponivel(atendimento); //TOHEN
                }, 60000);
            }
        } else {
            console.log('atendimeto id: '+atendimento.id+' | está fixo ao agente id: '+agente.id);
        }
    }
}

export const finalizaAtendimento = async (atendimento: Atendimento, clienteFinalizou: boolean) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_atendimento set datahora_fim = '" + data + "', cliente_finalizou = '" + (clienteFinalizou ? 'True' : 'False') + "' where" +
        " id = " + atendimento.id);
        let agente = await getAgenteById(atendimento.agente_id);
        let supervisor_id = 0;

        if (clienteFinalizou == true && atendimento.liberar_intervencao == 'True') {
            supervisor_id = atendimento.intervencao_supervisor_id;
        }
        
        await delAtendimento(atendimento);

        if (agente) {
            agente.qtdEmAtendimento = (agente.qtdEmAtendimento > 0 ? agente.qtdEmAtendimento - 1 : 0);
            await database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + agente.id);
            await checkAtendimentos(agente, false);
        }

        io.emit('atendimentoFinalizado', JSON.stringify({
            usuario_id: atendimento.agente_id,
            protocolo: atendimento.protocolo,
            supervisor_id: supervisor_id
        }));

    Log('Atendimento "' + atendimento.id + '" finalizado!'+'\n    File Info ( '+GetFileCode()+' )');

    await database.query("insert into tb_mensagem (atendimento_id, origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id, base64file, file_name, type_file, exists_image, " +
        " exists_document, type_mensagem) values (" + atendimento.id + "," + "'" + (clienteFinalizou ? 'CLIENTE' : 'AGENTE') + "', " + (clienteFinalizou ? atendimento.cliente.id : atendimento.agente_id) + ", " +
        "'" + data + "','Atendimento Finalizado pelo: " + (clienteFinalizou ? 'Cliente' : 'Agente') + "', " + atendimento.empresa_id + ", '" + atendimento.chave + "', " + (clienteFinalizou ? "'" + atendimento.chave + "'" : 'null') + ", " +
        " '',  '', '', 'False', 'False', 'texto')");
}

export const checkClienteWA = async (atendimento: Atendimento) => {
    let dadoCliente: any = await database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    let tronco = await getRemetenteById(atendimento.remetente_id)
    if (dadoCliente![0]![0]) {
        if (tronco.config.atualizar_nome_contato == 'True') {
            await database.query("update tb_cliente set telefone = '" + atendimento.numero + "', nome = '"+ atendimento.nome +
                "', whatsapp_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
                "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
                "  where whatsapp_id = '" + atendimento.chave + "' " +
                " and empresa_id = " + atendimento.empresa_id);
        } else {
            await database.query("update tb_cliente set telefone = '" + atendimento.numero +
                "', whatsapp_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
                "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
                "  where whatsapp_id = '" + atendimento.chave + "' " +
                " and empresa_id = " + atendimento.empresa_id);
        }
        dadoCliente = await database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    } else {
        database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadoCliente = await database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
        //inserir a tb_contato do usuario
    }
    atendimento.cliente = dadoCliente![0]![0];
}

export const checkCliente = async (atendimento: Atendimento) => {
    let dadoCliente: any = await database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    if (dadoCliente![0]![0]) {
        await database.query("update tb_cliente set telefone = '" + atendimento.numero +
            "' where cpf = '" + atendimento.cpf + "' " +
            " and empresa_id = " + atendimento.empresa_id);
        dadoCliente = await database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    } else {
        await database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadoCliente = await database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    atendimento.cliente = dadoCliente![0]![0];
}

export const getCliente = async (atendimento: Atendimento, cliente_id) => {
    let dadoCliente: any = await database.query("select * from tb_cliente where id = " + cliente_id +
        " and empresa_id = " + atendimento.empresa_id);
    // console.log('dados do cliente: ' + dadoCliente[0]);
    if (dadoCliente[0][0]){
        // console.log('entrei dados do cliente');
        atendimento.nome = dadoCliente![0]![0].nome;
        atendimento.cpf = dadoCliente![0]![0].cpf;
        atendimento.cliente = dadoCliente![0]![0];
    }    
}

export const iniciaAtendimento = async (atendimento: Atendimento) => {
    // console.log('numero do protocolo: ' + atendimento.protocolo);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    // Testar isso (DPHX)
    // let oAtendimento: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
    //     "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc");

    // console.log('oAtendimento iniciado !================================');
    // console.log(oAtendimento);


    let dadoAtendimento: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
        "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc limit 1");
    // console.log('dados do atendimento: ' + dadoAtendimento[0][0]);
    if (dadoAtendimento[0][0]) {
        if (!dadoAtendimento[0][0].datahora_fila) {
            await database.query("update tb_atendimento set datahora_fila = '" + atendimento.datahora_fila + "' where protocolo = '" + atendimento.protocolo + "' ");
        }
    } else {
        // atendimento.datahora_fila = (atendimento.datahora_fila ? atendimento.datahora_fila : data);
        // console.log('grava arquivo atendimento pelo protocolo ver grupo id: ',atendimento);
        await database.query("insert into tb_atendimento (protocolo, datahora_inicio, grupo_id, ura_id, empresa_id, tipo, cliente_id, remetente_id, cliente_chave) values ('" +
        atendimento.protocolo + "', '" + atendimento.datahora_inicio + "', " + atendimento.grupo_id + ", " + (atendimento.ura_id ? atendimento.ura_id : 0) + ", " + atendimento.empresa_id +
        ", '" + atendimento.tipo + "', " + atendimento.cliente.id + ", " + atendimento.remetente_id + ", '" + atendimento.chave + "');");

        let atendimentoId: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
            "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc limit 1");
        // console.log('new id of the atendimento: ' + atendimentoId[0][0].id);
        atendimento.id = atendimentoId[0][0].id; 
        Log('Novo Atendimento gravado no banco| ID: "' + atendimento.id + '"'+'\n    File Info ( '+GetFileCode()+' )');
    } 
}


export const updateDataHoraFilaAtendimento = async (atendimento_id) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    await database.query("update tb_atendimento set datahora_fila = '" + data + "' where id = " + atendimento_id);
}


export const checkAgenteDisponivel = async (atendimento: Atendimento) => {
    console.log("FUNCTION: checkAgenteDisponivel: ##############################");
    // console.log(atendimento);
    let remetente = await getRemetenteById(atendimento.remetente_id);
    // let listaAgente = await getAgentesByGrupoId(atendimento.grupo_id);   
    let agenteId = -1;
    let qtdAtend = 0;
    let qtdTotalAtend = 0;
    
        // GAMBIARRA DO CARLOS ##################################################################################################
        let listAgentes: any = await database.query("SELECT agente_id from tb_grupo_agente where grupo_id = "+atendimento.grupo_id);
        
        if (listAgentes[0].length > 0) {
            
            for (let index = 0; index < listAgentes[0].length; index++) {
                const element = listAgentes[0][index];
                let agente = await getAgenteById(element.agente_id);

                if (agente) {
                    if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo) continue;
                    if (agente.pausa_programada || agente.pausa) continue;
                    if (agente.empresa_id != atendimento.empresa_id) continue;


                    if (agenteId == -1) {
                        agenteId = agente.id;
                        qtdAtend = agente.qtdEmAtendimento;
                        qtdTotalAtend = agente.qtdAtendimentos;
                    }
                    if ((agente.qtdEmAtendimento <= qtdAtend) || (agente.qtdEmAtendimento == qtdAtend && agente.qtdAtendimentos < qtdTotalAtend)) {
                        agenteId = agente.id;
                        qtdAtend = agente.qtdEmAtendimento;
                        qtdTotalAtend = agente.qtdAtendimentos;
                    }


                }                

            }

            if (agenteId >= 0) {
                const agente = await getAgenteById(agenteId);
                console.log('tenho o agente')
                atendimento.retirar_pendente = true;
                await setAgenteAtendimento(agente, atendimento);
            }
        }
}

export const setAgenteAtendimento = async (agente: Agente, atendimento: Atendimento) => {
    console.log("FUNCTION: setAgenteAtendimento: ##############################");
    if (agente.empresa_id != atendimento.empresa_id) {
        // checkAgenteDisponivel(atendimento);
        console.log('### Erro no atendimento, sem empresa: agente:'+ agente.empresa_id +" - atendimento"+ atendimento.empresa_id);
        return ;
    } else console.log('agente creditado a atender o atendimento');
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    // console.log(atendimento);

    if (atendimento.timeout_aguarda_agente) {
        clearTimeout(atendimento.timeout_aguarda_agente);
        Log('Cancelado espera do agente ' + atendimento.agente_id + ' no atendimento ' + atendimento.id+'\n    File Info ( '+GetFileCode()+' )');
    }

    let intervencaoSupervisor =  (atendimento.intervencao ? atendimento.intervencao : 'False');
    let remetente = await getRemetenteById(atendimento.remetente_id);

    if (atendimento.agente_id && agente.id == atendimento.agente_id && (!atendimento.tranfer_new)) {
        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : data);
        io.emit('atendimentoBegin', JSON.stringify({
            usuario_id: agente.id,
            remetente_id: atendimento.remetente_id,
            tronco: remetente.descricao,
            cliente_id: atendimento.cliente.id,
            cliente_nome: (remetente.config.atualizar_nome_contato == 'False' ? (atendimento.cliente.nome ? atendimento.cliente.nome : atendimento.nome) : atendimento.nome),
            cliente_cpf: atendimento.cliente.cpf,
            cliente_telefone: atendimento.cliente.telefone,
            cliente_email: atendimento.cliente.email,
            avatar: atendimento.cliente.whatsapp_url_avatar,
            protocolo: atendimento.protocolo,
            atendimento_id: atendimento.id,
            id: atendimento.id,
            datahora_inicio: atendimento.datahora_inicio,
            datahora_fila: atendimento.datahora_fila,
            tipo: atendimento.tipo,
            intervencao: intervencaoSupervisor,
            liberar_intervencao: atendimento.liberar_intervencao,
            atm_finalizado: false
        })); 
        console.log('atendimentoBegin:' + atendimento.id);
        atendimento.agente_id = agente.id;
        atendimento.emEntendimento = true;
        console.log('atm atendido pelo agente id: ',atendimento.agente_id);     
    } else {
        let remetente = await getRemetenteById(atendimento.remetente_id);
        
        if (atendimento.datahora_atendimento) {
            await database.query("update tb_atendimento set agente_id = '" + agente.id + "' where id = " + atendimento.id);
        } else {
            await database.query("update tb_atendimento set datahora_atendimento = '" + data +
                "', agente_id = '" + agente.id + "' where id = " + atendimento.id);
        }

        let msgAgente: boolean = false;
        msgAgente = (atendimento.datahora_atendimento ? true : false);

        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : data);
        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : dt._now);
        atendimento.agente_id = agente.id;
        atendimento.emEntendimento = true;
        Log('Agente "' + agente.id + '" setado ao atendimento "' + atendimento.id + '"!'+'\n    File Info ( '+GetFileCode()+' )');

        io.emit('atendimentoBegin', JSON.stringify({
            usuario_id: agente.id,
            remetente_id: atendimento.remetente_id,
            tronco: remetente.descricao,
            cliente_id: atendimento.cliente.id,
            cliente_nome: (remetente.config.atualizar_nome_contato == 'False' ? (atendimento.cliente.nome ? atendimento.cliente.nome : atendimento.nome) : atendimento.nome),
            cliente_cpf: atendimento.cliente.cpf,
            cliente_telefone: atendimento.cliente.telefone,
            cliente_email: atendimento.cliente.email,
            avatar: atendimento.cliente.whatsapp_url_avatar,
            protocolo: atendimento.protocolo,
            atendimento_id: atendimento.id,
            id: atendimento.id,
            datahora_inicio: atendimento.datahora_inicio,
            datahora_fila: atendimento.datahora_fila,
            tipo: atendimento.tipo,
            intervencao: intervencaoSupervisor,
            liberar_intervencao: atendimento.liberar_intervencao,
            atm_finalizado: false
        }));
        console.log('atendimentoBegin:'+atendimento.id);

        let messeger = remetente.config.msg_boasvindas_agente.replace('{agente}', agente.nome);

        //novos campos: base64file file_name type_file exists_image exists_document
        console.log('remetente.config.permitir_enviar_mensagem_troca_agente: ',remetente.config.permitir_enviar_mensagem_troca_agente);
        console.log('msgAgente: ',msgAgente);
        if (remetente.config.permitir_enviar_mensagem_troca_agente == 'True' && msgAgente) {
            await gravaMensagem(atendimento, 'AGENTE', messeger, 'CI_' + atendimento.agente_id + '_' + data, atendimento.agente_id, data,'', '', '', 'False', 'False','texto', 'null');
        } else if(!msgAgente) {
            await gravaMensagem(atendimento, 'AGENTE', messeger, 'CI_' + atendimento.agente_id + '_' + data, atendimento.agente_id, data,'', '', '', 'False', 'False','texto', 'null');
        }

    }
    agente.qtdEmAtendimento++;
    agente.qtdAtendimentos++;
    await database.query("update tb_usuario set qtd_atendimentos=qtd_atendimentos+1 where id=" + agente.id);
    Log('Atendimento "' + atendimento.id + '" atendido pelo agente "' + agente.id + '".'+'\n    File Info ( '+GetFileCode()+' )');
}

export const checkAtendimentos = async (agente: Agente, getAtendimentosEmCurso: boolean) => {
    console.log("FUNCTION: checkAtendimentos: ##############################");
    let remetente = await getFirstRemetenteByEmpresaId(agente.empresa_id);

    console.log('grupo do agente: ',agente.grupo_id);

    if (getAtendimentosEmCurso) {
        let listaAtendimentosEmCurso = await getAtendimentosByAgenteId(agente.id);

        for (let index = 0; index < listaAtendimentosEmCurso.length; index++) {
            if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo) return;
            const atendimento = listaAtendimentosEmCurso[index];
            // (ALTERAR) (INVERTER IF)
            if (
                remetente.config.remover_agente_atendimento == 'False' 
                && atendimento.datahora_atendimento 
                && !atendimento.agente_id 
                && atendimento.retirar_pendente == false
            ) {
                // não faz nada
            } else
                await setAgenteAtendimento(agente, atendimento);               
        }
    }

    //Verificando atendimentos em aberto
    let listaAtendimentos = await getAtendimentosNaoAtendidos(agente.empresa_id);
    // console.log('listaAtendimentos: ',listaAtendimentos);
    for (let index = 0; index < listaAtendimentos.length; index++) {
        if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo) return;
        const atendimento = listaAtendimentos[index];
        if (
            remetente.config.remover_agente_atendimento == 'False' 
            && atendimento.datahora_atendimento 
            && !atendimento.agente_id
            && atendimento.retirar_pendente == false
        ) {
            // não faz nada
        } else
            await checkAgenteDisponivel(atendimento);
    }
}

export const getMensagens = async (cliente_id,tronco_id, protocolo) => {
    //campo para permitir todas as mensagens: permitir_visualizar_todas_conversas_cliente
    //campo para permitir as mensagens transferidas: permitir_visualizar_conversas_transferida
    let tronco = await getRemetenteById(tronco_id);

    console.log('tronco.config.permitir_visualizar_conversas_7_dias: ',tronco.config.permitir_visualizar_conversas_7_dias);
    console.log('tronco.config.permitir_visualizar_conversas_15_dias: ',tronco.config.permitir_visualizar_conversas_15_dias);
    console.log('tronco.config.permitir_visualizar_conversas_30_dias: ',tronco.config.permitir_visualizar_conversas_30_dias);
    console.log('tronco.config.permitir_visualizar_conversas_transferida: ',tronco.config.permitir_visualizar_conversas_transferida);

    if (tronco.config.permitir_visualizar_conversas_7_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_7_dias
        let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
        "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
        "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 7 day))");

        return dadosMsgs![0];
    }

    if (tronco.config.permitir_visualizar_conversas_15_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_15_dias
        let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
        "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
        "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 15 day))");

        return dadosMsgs![0];
    }

    if (tronco.config.permitir_visualizar_conversas_30_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_30_dias
        let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
        "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
        "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 30 day))");

        return dadosMsgs![0];
    }

    if (tronco.config.permitir_visualizar_conversas_transferida == 'True') {
        //listar todas as mensagens transferidas
        let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
        "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
        "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.protocolo = '" + protocolo + "'");

        return dadosMsgs![0];
    } else {
        let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
        "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where a.datahora_fim is null and " +
        "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "'");

        return dadosMsgs![0];
    }    

    // let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
    //     "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where date(a.datahora_inicio) = date(now()) and " +
    //     "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "'");
}

// create method to list of ura

export const reqListUraWA = async (empresa_id) => {
    return await database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
}

export const reqIdGrupoUra = async (ura_id) => {
    return await database.query("select * from tb_grupo_ura where ura_id = '" + ura_id + "'");
}

export const updateAtendimentoUraId = async (antendimento_id, ura_id, grupo_id) => {
    await database.query("update tb_atendimento set ura_id = '" + ura_id + "', grupo_id = '" + grupo_id + "' where id = '" + antendimento_id + "' ");
    return true;
}

export const reqListUra = async (empresa_id, socket) => {
    let dadosUra: any = await database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
    // console.log('dados ura: ' +  JSON.stringify(dadosUra[0]));
    // socket.emit('respListUra', JSON.stringify(dadosUra[0]));
}

export const clienteLogin = async (cliente, socket) => {
    let dt = dataTempo.create(cliente.data_inicio.toString());
    let data = dt.format('Y-m-d H:M:S');

    // get grupo_id with ura_id

    let grupoIdRetorno: any = await database.query("select grupo_id from tb_grupo_ura where ura_id = '" + cliente.ura_id + "' LIMIT 1");
    let grupoId: any = (grupoIdRetorno[0][0] ? grupoIdRetorno[0][0].grupo_id : null);
    
    if (!grupoId) {
        let tronco = await getRemetenteById(cliente.remetente_id);
        grupoId = tronco.grupo_id;
    }

    let atendimento: Atendimento = await getAtendimentoByCPF(cliente.cpf);
    if (!atendimento) {
        
        atendimento = {
            id: 0,
            emEntendimento: false,
            chave: socket.id,
            nome: cliente.nome,
            numero: cliente.telefone,
            avatar: '',
            nivel: 0,
            empresa_id: cliente.empresa_id,
            grupo_id: grupoId,
            ura_id: cliente.ura_id,
            remetente_id: cliente.remetente_id,
            datahora_inicio: data,
            datahora_fila: data,
            tipo: 'WEB',
            cpf: cliente.cpf
        };
        
        await addAtendimento(atendimento);
        await iniciaAtendimentoWEB(atendimento, socket);
    } else {
        
        atendimento.chave = socket.id;
        atendimento.grupo_id = grupoId;
        await updateChaveAtendimento(atendimento);
        socket.emit('atendEmCurso', atendimento);
        await carregaMensagensAtendimento(atendimento);
        Log('Atendimento "' + atendimento.id + '" continuado...'+'\n    File Info ( '+GetFileCode()+' )')
    }
}

export const updateChaveAtendimento = async (atendimento: Atendimento) => {
    await database.query("update tb_atendimento set cliente_chave = '" + atendimento.chave + "', grupo_id = '" + atendimento.grupo_id + "' where id = " + atendimento.id);
}

export const iniciaAtendimentoWEB = async (atendimento: Atendimento, socket) => {
    let remetente = await getRemetenteById(atendimento.remetente_id);
    await checkCliente(atendimento);
    let data = new Date();
    atendimento.preAtendimento = true;
    
    let sProtocolo = await database.query("CALL sp_getprotocolo('"+atendimento.numero+"');");
    atendimento.protocolo = sProtocolo[0][0][0].protocolo;

    // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
    //     checkNumero(data.getDate()).toString() + atendimento.cpf.substring(0, 4) + checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
    //     + checkNumero(data.getSeconds()).toString();
    

    // criar um metodo pra fazer o trabalho da ura;
    await iniciaAtendimento(atendimento);
    socket.emit('clienteLoginResp', {
        success: true,
        retorno: atendimento,
        mensagens: [
            // {
            //     msg: remetente.config.msg_boot_nivel2_pergunta,
            //     tipo: 'AGENTE',
            //     data: new Date()
            // },
            {
                msg: 'O número de protocolo do seu atendimento é: ' + atendimento.protocolo,
                tipo: 'AGENTE',
                data: new Date()
            }
        ]
    })
    atendimento.nivel = 3;

    await checkAgenteDisponivel(atendimento);
}

export const carregaMensagensAtendimento = async (atendimento: Atendimento) => {
    let dadosMensagens: any = await database.query("select * from tb_mensagem where atendimento_id = " + atendimento.id);

    if (!dadosMensagens![0]) return;
    for (let index = 0; index < dadosMensagens[0].length; index++) {
        const mensagem = dadosMensagens[0][index];

        io.emit('msgReceived', {
            id: atendimento.chave,
            msg: mensagem.mensagem.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&apos;/g, "\\'").replace(/<br>/g, '\n'),
            tipo: mensagem.origem,
            data: new Date(mensagem.datahora_envio)
        });

    }
}