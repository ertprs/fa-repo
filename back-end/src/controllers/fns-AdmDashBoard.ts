import * as dataTempo from 'node-datetime';
import { io } from './../libs/io';
import { getAgentes, getAgentesByEmpresaId } from './../models/agente-model';
import { getRemetentes } from './../models/remetente-model';
import { Log } from '../globais/logs';
import { acGroupBy } from '../globais/funcs';
import { getAtendimentosByEmpresaId } from '../models/atendimento-model';
import { acGetCardByEmpresaID } from '../models/charts-model';


export const sendDashBoardAgentes = async () => {
    let remetentes = await getRemetentes();
    let empresas = await acGroupBy ('empresa_id',remetentes);
    
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let agentes = [];
        let agents_list = await getAgentesByEmpresaId(empresa.empresa_id);

        for (let index = 0; index < agents_list.length; index++) {
            const item = agents_list[index];
            
            const agente = {
                usuario_id: item.id,
                nome: item.nome,
                empresa_id: item.empresa_id,
                grupo_id: item.grupo_id,
                grupo_nome: item.grupo_nome,
                qtd_atendimentos: item.qtdEmAtendimento,
                atendidos: item.qtdAtendimentos,
                qtd_intervencoes: 0
            };

            agentes.push(agente);
        }
       
        io.emit('sendEstatisticasAgente', empresa.empresa_id, agentes);  
    }
}


export const sendDashBoardCards = async () => {
    let remetentes = await getRemetentes();
    let empresas = await acGroupBy ('empresa_id',remetentes);
    
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let atendimentos = await getAtendimentosByEmpresaId(empresa.empresa_id);
        let atm_ura = atendimentos.filter(atm => !atm.datahora_fila);
        let atm_fila = atendimentos.filter(atm => atm.datahora_fila && !atm.datahora_atendimento);
        let atm_atendimento = atendimentos.filter(atm => atm.datahora_fila && atm.datahora_atendimento && atm.agente_id > 0);
        let atm_pendente = atendimentos.filter(atm => atm.datahora_fila && atm.datahora_atendimento && (atm.agente_id == 0 || atm.agente_id == null));
        let TMatendimento = '00:00:00';
        let TMfila = '00:00:00';
        let TMUra = '00:00:00';
        let qtd = 0;
        let atendidas = 0;
        let abandonos = 0;


        let card = await acGetCardByEmpresaID(empresa.empresa_id);
        if (card){
            TMatendimento = card.TMatendimento;
            TMfila = card.TMfila;
            TMUra = card.TMUra;
            qtd = Math.floor(card.atendidos + card.abandonados);
            atendidas = card.atendidos;
            abandonos = card.abandonados;
        }

        let stats = {
            em_atendimento: atm_atendimento.length,
            em_fila: atm_fila.length,
            em_ura: atm_ura.length,
            pendentes: atm_pendente.length,
            TMatendimento: TMatendimento,
            TMfila: TMfila,
            TMUra: TMUra
        }

        io.emit('sendEstatisticasCards', empresa.empresa_id, stats);
        io.emit('sendEstatisticasGrafico', empresa.empresa_id, {qtd: qtd, atendidas: atendidas, abandonos: abandonos});
        
    }    

}