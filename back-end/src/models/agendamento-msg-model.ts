import { Log } from './../globais/logs';

export interface AgendamentoMsg {
    id: number,
    empresa_id: number,
    remetente_id: number,
    usuario_id: number,
    nome_cliente: string,
    mensagem: string,
    numero: string,
    datahora_envio: string,
    exist_imagem: string,
    existe_documento: string
}

const agendamentoMsg: AgendamentoMsg[] = [];

export const getAgendamentoMsg = async () => {
    return agendamentoMsg;
}

export const getAgendamentoMsgById = async (id: number) => {
    return agendamentoMsg.find(x => x.id == id);
}

export const getAgendamentoMsgByEmpresaId = async (empresa_id: number) => {
    return agendamentoMsg.filter(x => x.empresa_id == empresa_id);
}

export const getAgendamentoMsgByRemetenteId = async (remetente_id: number) => {
    return agendamentoMsg.filter(x => x.remetente_id == remetente_id);
}

export const addAgendamentoMsg = async (agendamentosMsg: AgendamentoMsg) => {
    agendamentoMsg.push(agendamentosMsg);
    Log('AgendamentoMsg "' + agendamentosMsg.id + '" adicionado na lista!');
}

export const delAgendamentoMsg = async (agendamentosMsg: AgendamentoMsg) => {
    let id: number = agendamentosMsg.id;

    for (let index = 0; index < agendamentoMsg.length; index++) {
        const agend = agendamentoMsg[index];
        if (agend.id == id) {
            agendamentoMsg.splice(index, 1);
            Log('AgendamentoMsg "' + id + '" removido na lista!');
        }
    }
}