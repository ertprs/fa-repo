
import * as puppeteer from 'puppeteer';
import { Log } from './../globais/logs';

export enum RemetenteTipo {
    WHATSAPP = 'Whatsapp',
    WEB = 'Web',
    FACEBOOK = 'FACEBOOK'
}
export interface Remetente {
    id: number,
    empresa_id: number,
    grupo_id: number,
    grupo_nome: string,
    descricao: string,
    tipo: RemetenteTipo,
    page?: puppeteer.Page,
    browser?: puppeteer.Browser,
    status: string,
    mynumber?: string,
    config?: any,
    remetente?: string,
    autenticado?: boolean,
    checandoCampanhas?: any,
    checandoStatusMensagem?: any,
    palavra_chave?: string,
    impulsionar?: string,
    redirect?: number,
    token?: string,
    tipo_phone_whatsapp?: string,
    batteryLevel?: string
}

const remetentes: Remetente[] = [];

export const getRemetentes = async () => {
    return remetentes;
}

export const getRemetentesFilter = async () => {
    return remetentes.map(x => {
        return {
            id: x.id,
            descricao: x.descricao,
            grupo_id: x.grupo_id,
            grupo_nome: x.grupo_nome,
            autenticado: x.autenticado,
            empresa_id: x.empresa_id
        }
    });
}
export const getRemetenteById = async (id: number) => {
    return remetentes.find(x => x.id == id);
}

export const getFirstRemetenteByEmpresaId = async (empresa_id: number) => {
    for (let index = 0; index < remetentes.length; index++) {
        const remetente = remetentes[index];
        if (remetente.empresa_id == empresa_id) return remetente;
    }
}

export const getRemetenteByEmpresaId = async (empresa_id: number) => {
    return remetentes.filter(x => x.empresa_id == empresa_id);
}

export const getRemetenteByMyNumber = async (mynumber: string) => {
    return remetentes.find(x => 
        (x.mynumber.length == 13 ? x.mynumber : x.mynumber.substring(0,4)+'9'+x.mynumber.substring(4)) 
        == 
        (mynumber.length == 13 ? mynumber : mynumber.substring(0,4)+'9'+mynumber.substring(4))
    );
}

export const addRemetente = async (remetente: Remetente) => {
    remetentes.push(remetente);
    Log('Remetente "' + remetente.id + '" adicionado na lista!');
}

export const delRemetente = async (remetente: Remetente) => {
    let id: number = remetente.id;

    for (let index = 0; index < remetentes.length; index++) {
        const rem = remetentes[index];
        if (rem.id == id) {
            remetentes.splice(index, 1);
            Log('Remetente "' + id + '" removido na lista!');
        }
    }
}