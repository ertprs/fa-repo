import { Log } from './../globais/logs';
import { acGenChartCard } from './charts-model';

export interface Atendimento {
    id: number,
    remetente_id: number,
    // grupo_id: number,
    grupo_id: any,
    empresa_id: number,
    agente_id?: number,
    ura_id?: any,
    chave: string,
    timeout_aguarda_agente?: any
    preAtendimento?: boolean,
    emEntendimento: boolean,
    datahora_inicio?: string,
    datahora_fila?: string
    datahora_atendimento?: string,
    datahora_fim?: string,
    ultimaInteracao?: number,
    nivel?: number,
    cpf?: string,
    numero?: string,
    avatar?: string,
    nome?: string,
    protocolo?: string,
    cliente?: any,
    tipo: string,
    intervencao_supervisor_id?: number,
    intervencao?: string,
    liberar_intervencao?: string,
    controle_ura?: string,
    tranfer_new?: boolean,
    retirar_pendente?: boolean,
    notRepeteMsgUraBegin?: boolean,
    atm_ura_presa?: boolean,
    inicio_atm?: boolean
}

const atendimentos: Atendimento[] = [];

export const getAtendimentos = async () => {
    return atendimentos;
}

export const getAtendimentoByTrontoId = async (remetente_id: number) => {
    return atendimentos.filter(x => x.remetente_id == remetente_id);
}

export const getAtendimentoById = async (id: number) => {
    return atendimentos.find(x => x.id == id);
}

export const getAtendimentosByEmpresaId = async (empresa_id: number) => {
    return atendimentos.filter(atm => atm.empresa_id == empresa_id);
}

export const getAtendimentosByAgenteId = async (agente_id: number) => {
    return atendimentos.filter(x => x.agente_id == agente_id);
}

export const getAtendimentosNaoAtendidos = async (empresa_id?: number) => {
    return atendimentos.filter(x => (!x.agente_id || x.agente_id == 0) && x.empresa_id == empresa_id);
}

export const getTodosAtendimentosNaoAtendidos = async () => {
    return atendimentos.filter(x => (!x.agente_id || x.agente_id == 0));
}

export const getAtendimentosEmUra = async () => {
    return atendimentos.filter(x => ((!x.agente_id || x.agente_id == 0) && (!x.datahora_fila && !x.datahora_atendimento)));
}

export const getAtendimentoByChave = async (chave: string, remetente_id?: number) => {
    return atendimentos.find(x => x.chave == chave);
}

export const getAtendimentoByNumeroTronco = async (numero: string, tronco_id: number) => {
    return atendimentos.find(x => (x.cliente ? x.cliente.telefone == numero && x.remetente_id == tronco_id : x.numero == numero && x.remetente_id == tronco_id ));
}

export const getAtendimentoByChaveRemetenteId = async (chave: string, remetente_id: number) => {
    return atendimentos.find(x => x.chave == chave && x.remetente_id == remetente_id);
}

export const getAtendimentoByCPF = async(cpf: string) => {
    return atendimentos.find(x => x.cpf == cpf);
}

export const addAtendimento = async (atendimento: Atendimento) => {
    atendimentos.push(atendimento);
    Log('Atendimento "' + atendimento.id + '" adicionado na lista!');
}

export const delAtendimento = async (atendimento: Atendimento) => {
    let id: number = atendimento.id;

    for (let index = 0; index < atendimentos.length; index++) {
        const atend = atendimentos[index];
        if (atend.id == id) {
            await acGenChartCard(atend);
            atendimentos.splice(index, 1);
            Log('Atendimento "' + id + '" removido na lista!');
        }
    }
}