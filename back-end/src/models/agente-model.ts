import { Log } from './../globais/logs';
import { Agente } from './agente-model';

export interface Agente {
    id: number,
    socket?: string,
    empresa_id: number,
    grupo_id: number,
    grupo_nome?: string,
    nome: string,
    qtdAtendimentos?: number,
    qtdEmAtendimento?: number,
    pausa_programada?: boolean,
    pausa?: boolean,
    pausa_tipo?: string,
    pausaId?: number
}

const agentes: Agente[] = [];

export const getAgentes = async () => {
    return agentes;
}

export const getAgenteById = async (id: number) => {
    return agentes.find(x => x.id == id);
}

export const getAgenteBySocket = async (socket: string) => {
    return agentes.find(x => x.socket == socket);
}

export const getAgentesByGrupoId = async (grupo_id: number) => {
    // return agentes.filter(x => x.grupo_id == grupo_id).sort(function(a,b) {return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0;});
    return agentes.filter(x => x.grupo_id == grupo_id)
}

export const getAgentesByEmpresaId = async (empresa_id: number) => {
    return agentes.filter(x => x.empresa_id == empresa_id).sort(function(a,b) {return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0;});
}

export const getAgentForSetAtt = async (empresa_id: number, qtd_max) => {
    return agentes.filter(x => x.empresa_id == empresa_id && x.qtdEmAtendimento < qtd_max).sort(function(a,b) {return a.qtdEmAtendimento < b.qtdEmAtendimento ? -1 : a.qtdEmAtendimento > b.qtdEmAtendimento ? 1 : 0;});
}

export const addAgente = async (agente: Agente) => {
    agentes.push(agente);
}

export const delAgente = async (agente: Agente) => {
    let id = agente.id;
    for (let index = 0; index < agentes.length; index++) {
        const age = agentes[index];
        if (age.id == id) {
            agentes.splice(index, 1);
            Log('Agente "' + id + '" removido na lista!');
        }
    }
}