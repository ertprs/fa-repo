import * as dataTempo from 'node-datetime';
import { 
    Agente, 
    getAgenteBySocket, 
    delAgente, 
    getAgenteById, 
    addAgente, 
    getAgentesByEmpresaId 
} from './../models/agente-model';
import { database } from './../libs/conexao';
import { 
    removeAgenteAtendimento, 
    checkAtendimentos, 
    finalizaAtendimento 
} from './atendimento-controller';
import { 
    getRemetenteById, 
    RemetenteTipo 
} from './../models/remetente-model';
import { reinicializar } from './remetente-controller';
import { getAtendimentoById, 
    getAtendimentoByChave, 
    getAtendimentosByAgenteId 
} from './../models/atendimento-model';
import { gravaMensagem } from './mensagem-service';
import { io } from './../libs/io';
import { Grupo, addGrupo } from './../models/grupo-models';
import { execSQL } from '../globais/dbconn';

export const dbLogoff = async (agente: Agente) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_agente_login set datahora_logout = '" + data + "' where usuario_id = " + agente.id +
        " and datahora_logout is null");
}

export const dbFinalizaPausa = async (agente: Agente) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_agente_pausa set datahora_fim = now() where usuario_id = " + agente.id +
        " and datahora_fim is null");
    
}

export const agentePausa = async (agente: Agente, tipo: string, temProgramado: boolean) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    if (temProgramado) {
        await database.query("update tb_agente_pausa set datahora_inicio= '" + data + "' where id = " + agente.pausaId);
        agente.pausa_programada = false;
    } else {
        await database.query("insert into tb_agente_pausa (usuario_id, datahora_inicio, datahora_programado, tipo, grupos_id) values (" +
            agente.id + ", '" + data + "', '" + data + "', '" + tipo + "', " +
            "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
            " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'))");

        let dadoPausa: any = await database.query("select * from tb_agente_pausa where usuario_id = " + agente.id +
            " and datahora_fim is null order by id desc limit 1");
        agente.pausaId = dadoPausa[0][0].id;
        agente.pausa_programada = false;
    }

}

export const agentePausaProgramada = async (agente: Agente, tipo) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    await database.query("insert into tb_agente_pausa (usuario_id, datahora_programado, tipo, grupos_id) values (" +
        agente.id + ", '" + data + "', '" + tipo + "', " +
        "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
        " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'))");
    let dadoPausa: any = await database.query("select * from tb_agente_pausa where usuario_id = " + agente.id +
        " and datahora_fim is null order by id desc limit 1");
    agente.pausaId = dadoPausa[0][0].id;
    agente.pausa_programada = true;
}

export const desconectar = async (socket_id: string, agente_id) => {
    let agente: Agente;
    if (agente_id != null) {
        agente = await getAgenteById(agente_id);
    } else {
        agente = await getAgenteBySocket(socket_id);
    }
    
    if (agente) {
        await dbFinalizaPausa(agente);
        await removeAgenteAtendimento(agente);
        await dbLogoff(agente);
        await delAgente(agente);
        if(agente_id != null) io.emit('deslogandoUsuario', agente.id);
        return;
    }
        
    
    let atendimento = await getAtendimentoByChave(socket_id);
    if (atendimento) {
        finalizaAtendimento(atendimento, false);
    }        
      
}

export const removeAgenteSocket = async (socket_id: string) => {
    console.log('Removendo agente por desconexao do socket');
    let agente = await getAgenteBySocket(socket_id);
    if (!agente) return;
    agente.socket = null;
    setTimeout(async () => {
        let agenteVerifica = await getAgenteById(agente.id);
        if (!agenteVerifica) return;
        if (agenteVerifica.socket == null) {
            console.log('tem que deslogar o agente por nao ter socket');
            await removeAgenteAtendimento(agente);
            await dbLogoff(agente);
            await delAgente(agente);
        }
    }, 180000);
}

export const agenteLogin = async (login: any) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    let sAgente: Agente = await getAgenteById(login.usuario_id);
    if (sAgente) {
        delAgente(sAgente);
    }

    let agente:  Agente = {
        id: login.usuario_id,
        nome: login.nome,
        empresa_id: login.empresa_id,
        grupo_id: login.grupo_id,
        grupo_nome: login.grupo_nome,
        pausa: false,
        pausaId: 0,
        pausa_programada: false,
        pausa_tipo: '',
        qtdAtendimentos: 0,
        qtdEmAtendimento: 0,
        socket: login.socket_id
    };
    await addAgente(agente);

    await execSQL("update tb_usuario set qtd_atendimentos='0' where id="+agente.id);
    await execSQL("update tb_agente_login set datahora_logout=NOW() where usuario_id = "+ agente.id +"  and datahora_logout is null;");
    await execSQL("insert into tb_agente_login (usuario_id, datahora_login,grupos_id) values (" + agente.id + ", '" + data + "', " +
    "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
    " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'));");
   
    return agente;
}

export const cancelarPausa = async (usuario) => {
    let agente = await getAgenteById(usuario.usuario_id);
    if (agente) {
        agente.pausa_programada = false;
        agente.pausa_tipo = '';
        agente.pausa = null;
        await dbFinalizaPausa(agente);
        await checkAtendimentos(agente, false);
    }
}

export const programarPausa = async (usuario) => {
    let agente = await getAgenteById(usuario.usuario_id);
    if (agente) {
        agente.pausa_programada = true;
        agente.pausa_tipo = usuario.tipo;
        if (agente.qtdEmAtendimento == 0) {
            await agentePausa(agente, usuario.tipo, false);
        } else {
            await agentePausaProgramada(agente, usuario.tipo);
        }
        return agente.pausaId;
    }
}

export const userSendMsg = async (msg) => {
    console.log("FUNCTION: userSendMsg: ##############################");
    // console.log(msg);
    let agente = await getAgenteById(msg.origem_id);
    let remetente = await getRemetenteById(msg.remetente_id);
    let atendimento = await getAtendimentoById(msg.atendimento_id);
    // console.log('atm idid: ',atendimento);
    if (remetente && atendimento) { //&& agente) {
        console.log('enviando mensagem');
    // if (remetente && (remetente.autenticado || remetente.tipo == RemetenteTipo.WEB) && atendimento) { //&& agente) {
    // if (remetente && (remetente.autenticado || remetente.tipo == RemetenteTipo.WEB) && atendimento && agente) {
        //novos campos: base64file file_name type_file exists_image exists_document
        await gravaMensagem(atendimento, 'AGENTE', msg.msg, msg.msg_id, msg.origem_id, msg.envio_datahora,msg.base64file, msg.file_name, msg.type_file, msg.exists_image, msg.exists_document, msg.tipo, 'null');
    } else {
        throw new Error('Não foi possível enviar a mensagem. Tente novamente!');
    }
}

export const getQtdAtendimentos = async (agente: Agente) => {
    let atendimentos = await getAtendimentosByAgenteId(agente.id);
    agente.qtdEmAtendimento = atendimentos.length;
}
