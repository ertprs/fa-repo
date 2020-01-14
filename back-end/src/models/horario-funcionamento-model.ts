import { Log } from './../globais/logs';

export interface HorariosFuncionamento {
    id: number,
    empresa_id: number,
    tronco_id: number,
    dia_semana: string,
    hora_inicio: string,
    hora_fim: string,
    mensagem: string,
    ativo: string
}

const horariosFuncionamentos: HorariosFuncionamento[] = [];

export const getHorariosFuncionamento = async () => {
    return horariosFuncionamentos;
}

export const getHorariosFuncionamentoById = async (id: number) => {
    return horariosFuncionamentos.find(x => x.id == id);
}

export const getHorariosFuncionamentoByEmpresaId = async (empresa_id: number) => {
    return horariosFuncionamentos.filter(x => x.empresa_id == empresa_id);
}

export const getHorariosFuncionamentoByTroncoId = async (tronco_id: number) => {
    return horariosFuncionamentos.filter(x => x.tronco_id == tronco_id);
}

export const addHorariosFuncionamento = async (horarioFuncionamento: HorariosFuncionamento) => {
    horariosFuncionamentos.push(horarioFuncionamento);

    Log('Horario de funcionamento adicionado com id: '+horarioFuncionamento.id);
}

export const delHorariosFuncionamento = async (horarioFuncionamento: HorariosFuncionamento) => {
    let id = horarioFuncionamento.id;

    for (let index = 0; index < horariosFuncionamentos.length; index++) {
        const horaFunc = horariosFuncionamentos[index];
        
        if (horaFunc.id == id) {
            horariosFuncionamentos.splice(index, 1);
            Log('Registro removido com sucesso, Horario de Funcionamento id: '+id);
        }
    }
}

// ####### DATAS COMEMORATIVAS E FERIADOS #######
export interface DatasFeriados {
    id: number,
    empresa_id: number,
    tronco_id: number,
    mensagem: string,
    datahora_inicio: string,
    datahora_fim: string,
    ativo: string
}

const datasFeriados: DatasFeriados[] = [];

export const getDatasFeriados = async () => {
    return datasFeriados;
}

export const getDatasFeriadosById = async (id: number) => {
    return datasFeriados.find(x => x.id == id);
}

export const getDatasFeriadosByEmpresaId = async (empresa_id: number) => {
    return datasFeriados.filter(x => x.empresa_id == empresa_id);
}

export const getDatasFeriadosByTroncoId = async (tronco_id: number) => {
    return datasFeriados.filter(x => x.tronco_id == tronco_id);
}

export const addDatasFeriados = async (datasFeriado: DatasFeriados) => {
    datasFeriados.push(datasFeriado);
    Log('Datas e Feriados adicionado com id: '+datasFeriado.id);
}

export const delDatasFeriados = async (datasFeriado: DatasFeriados) => {
    let id: number = datasFeriado.id;

    for (let index = 0; index < datasFeriados.length; index++) {
        const dataFeriado = datasFeriados[index];
        
        if (dataFeriado.id == id) {
            datasFeriados.splice(index, 1);
            Log('Registro removido com sucesso, Data e Feriados id: '+id);
        }
    }
}




