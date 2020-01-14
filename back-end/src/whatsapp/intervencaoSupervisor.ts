import { database } from './../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Log } from './../globais/logs';
import { 
    getAtendimentoById, 
    addAtendimento, 
    Atendimento
} from "./../models/atendimento-model";
import { io } from './../libs/io';


export const intervencaoSupervisor = async (atendimento_id: number, socket) => {
    let atendimento = await getAtendimentoById(atendimento_id);
    //dar um select no banco e pegar o id do supervisor do grupo e adicionar ao campo
    let intervencaoSupervisorId = await database.query("select supervisor_id from tb_grupo where id = " + atendimento.grupo_id);
    // console.log('intervencao_supervisor_id e: '+intervencaoSupervisorId[0][0].supervisor_id)
    atendimento.intervencao_supervisor_id = (intervencaoSupervisorId[0][0] ? intervencaoSupervisorId[0][0].supervisor_id : '');

    await database.query("update tb_atendimento set intervencao_supervisor_id = '" + atendimento.intervencao_supervisor_id + "', " +
    " liberar_intervencao = 'True' where  id = " + atendimento.id);
    atendimento.liberar_intervencao = 'True';
    //dar um emit avisando que a intervenção foi realizada ok
    // socket.emit('userPaused', JSON.stringify({ success: true }));
}

export const updateIntervencaoSupervisor = async (atendimento_id: number) => {
    console.log('update intervencao: ',atendimento_id);
    let atendimento = await getAtendimentoById(atendimento_id);
    await database.query("update tb_atendimento set intervencao = 'True' where id = " + atendimento_id);
    atendimento.intervencao = 'True';
}

export const encerrarIntervencaoSupervisor = async (atendimento_id: number, socket) => {
    console.log('encerrar intervencao: ',atendimento_id);    
    let atendimento = await getAtendimentoById(atendimento_id);
    if (atendimento) {
        await database.query("update tb_atendimento set intervencao = 'False', liberar_intervencao = 'False' where id = " + atendimento_id);
        // if (atendimento.intervencao == undefined || atendimento.intervencao == 'True')
        atendimento.intervencao = 'False';
        // (atendimento.intervencao == 'False' ? atendimento.intervencao = 'False' : atendimento.intervencao = 'False');
        console.log('intervencao ',atendimento.intervencao);
        atendimento.liberar_intervencao = 'False';
        // socket.emit('encerrarIntervencaoResp', JSON.stringify({ atendimento_id: atendimento_id }));
        // socket.emit('encerrarIntervencaoResp', atendimento_id);
        // io.emit('encerrarIntervencaoResp', atendimento_id);
        await terminarIntervencaoSupervisor(atendimento_id);
    }    
}

function terminarIntervencaoSupervisor(atendimento_id) {
    io.emit('encerrarIntervencaoResp', atendimento_id);
}