import { 
    AgendamentoMsg,
    getAgendamentoMsg,
    getAgendamentoMsgById,
    addAgendamentoMsg,
    delAgendamentoMsg 
} from './../models/agendamento-msg-model';
import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { checkNumero } from './../globais/funcs';

export const removeAgendamentoMsg = async (agendamentoMsg : AgendamentoMsg) => {
    let listAgendamentoMsg = await getAgendamentoMsgById(agendamentoMsg.id);
}

export const adicionarAgendamentoMsg = async (agendamentoMsg : AgendamentoMsg) => {
    let adAgendamentoMsg = await addAgendamentoMsg(agendamentoMsg);
}

export const checkAgendamentoMsg = async (socket) => {
    let agendamentosMsg = await getAgendamentoMsg();
}
