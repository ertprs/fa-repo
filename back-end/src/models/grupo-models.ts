import { Log } from './../globais/logs';

export interface Grupo {
    id: number,
    nome: string,
    empresa_id: number,
    supervisor_id?: number,
    agente_id: number
}

const grupos: Grupo[] = [];

export const getGrupos = async () => {
    return grupos;
}

export const getGrupoById = async (id: number) => {
    return grupos.find(x => x.id == id);
}

export const getGrupoByAgenteId = async (agente_id: number) => {
    return grupos.filter(x => x.agente_id == agente_id);
}

export const getGrupoByEmpresaId = async (empresa_id: number) => {
    return grupos.filter(x => x.empresa_id == empresa_id);
}

export const addGrupo = async (grupo: Grupo) => {
    grupos.push(grupo);
    Log('Grupo "' + grupo.id + '" adicionado na lista!');
}

export const delGrupo = async (agente_id: number) => {
    for (let index = 0; index < grupos.length; index++) {
        const grupo = grupos[index];
        if (grupo.agente_id == agente_id) {
            grupos.splice(index, 1);
            Log('Grupo "' + grupo.id + '" removido na lista!');
        }
    }
}
