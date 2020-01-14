import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { getRemetenteById, getRemetentes } from './../models/remetente-model';
import { getAtendimentoById, getAtendimentosEmUra } from './../models/atendimento-model';
import { checkAgenteDisponivel, setAgenteAtendimento } from './../controllers/atendimento-controller';
import { getAgenteById, getAgentForSetAtt } from './../models/agente-model';
import { execSQL } from '../globais/dbconn';

export const transferirGrupoEstorno = async () => {
    console.log("FUNCTION: transferirGrupoEstorno: (TRANSBORBO) ##############################");
    // CRAIR A LOGICA DE REDIRECIONAR PARA O GRUPO DE ESTORNO
    // await transboardUra();
    // await transboardFila();
    // console.log('saiu tranboarde');

    let atendimentos = await getAtendimentosEmUra();
    if (atendimentos){
        for (let index = 0; index < atendimentos.length; index++) {
            const atendimento = atendimentos[index];
            let remetente = await getRemetenteById(atendimento.remetente_id);

            if (remetente.config.permitir_ura == '1' && remetente.config.permitir_grupo_estorno == '1' && remetente.config.grupo_transbordo_id > 0) {
                let startDate = new Date(atendimento.datahora_inicio);
                let endDate = new Date();
                let sTempoNaUra = (endDate.getTime() - startDate.getTime())/1000;
                let sParametroDeTempo = Math.floor(remetente.config.tempo_redirecionar_grupo_estorno *60);
                if (sTempoNaUra > sParametroDeTempo){
                    let agentes = await getAgentForSetAtt(atendimento.empresa_id, remetente.config.qtd_atendimento_simultaneo);
                    if(agentes){
                        for (let index = 0; index < agentes.length; index++) {
                            const agente = agentes[index];
                            if(agente.grupo_id == remetente.config.grupo_transbordo_id){
                                let dt = dataTempo.create();
                                let data = dt.format('Y-m-d H:M:S');
                                atendimento.datahora_fila = (atendimento.datahora_fila ? atendimento.datahora_fila : data);
                                atendimento.grupo_id = agente.grupo_id;

                                await execSQL("update tb_atendimento set grupo_id='"+atendimento.grupo_id+"', datahora_fila='"+atendimento.datahora_fila+"' where id='"+atendimento.id+"';");
                                await setAgenteAtendimento(agente, atendimento);
                                break;
                                // console.log('TRABSBORDO: (Atendimento: '+atendimento.id+' Setado para o Agente: '+ agente.nome+')');
                            }
                        }
                    }
                }
            }
    
        }
    }
}


export const transboardUra = async () => {
    // console.log('transboardUra');
    let agenteId = -1;
    let qtdAtend = 0;
    let qtdTotalAtend = 0;
    
    let listaAtendimentosUra: any = await database.query("SELECT a.*, TIMESTAMPDIFF(MINUTE,a.datahora_inicio,NOW()) as diferenca from tb_atendimento a "+
        "where a.datahora_inicio is not null and a.datahora_fila is null and a.datahora_atendimento is null and a.datahora_fim is null");

    // console.log('difenca ura: ',listaAtendimentosUra[0][0].diferenca);
    if (listaAtendimentosUra[0][0]) {
        for (let index = 0; index < listaAtendimentosUra[0].length; index++) {
            const atm = listaAtendimentosUra[0][index];
            let remetente = await getRemetenteById(atm.remetente_id);
            let atendimento = await getAtendimentoById(atm.id);
            // console.log('permitir_mover_ura_transbordo: ',remetente.config.permitir_mover_ura_transbordo);
            // console.log('tempo_mover_ura_transbordo: ',remetente.config.tempo_mover_ura_transbordo);
            if (remetente.config.permitir_mover_ura_transbordo == 'True') {
                if (atm.diferenca >= remetente.config.tempo_mover_ura_transbordo) {
                    let grupoEstorno: any = await database.query("SELECT * from tb_grupo where grupo_estorno = 'True' and empresa_id = " + atm.empresa_id);
                    // console.log('grupo de transborde id: ',grupoEstorno[0][0].id);

                    let listAgentes: any = await database.query("SELECT agente_id from tb_grupo_agente where grupo_id = "+grupoEstorno[0][0].id);
                    // console.log('lista de id agentes transboard ura: ',listAgentes[0][0])
                    if (listAgentes[0][0]) {
                        for (let index = 0; index < listAgentes[0].length; index++) {
                            const element = listAgentes[0][index];
                            console.log('agente ura transboard: ',element);
                            let agente = await getAgenteById(element.agente_id);
                            if (agente) {
                                if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo) continue;
                                if (agente.pausa_programada || agente.pausa) continue;
                                if (agenteId == -1) {
                                    agenteId = agente.id;
                                    qtdAtend = agente.qtdEmAtendimento;
                                    qtdTotalAtend = agente.qtdAtendimentos;
                                }
                                if ((agente.qtdEmAtendimento < qtdAtend) || (agente.qtdEmAtendimento == qtdAtend && agente.qtdAtendimentos < qtdTotalAtend)) {
                                    agenteId = agente.id;
                                    qtdAtend = agente.qtdEmAtendimento;
                                    qtdTotalAtend = agente.qtdAtendimentos;
                                }

                                // console.log('agenteId: ',agenteId);
                            }                
                        }

                        if (agenteId >= 0) {
                            const agente = await getAgenteById(agenteId);
                            let dt = dataTempo.create();
                            let data = dt.format('Y-m-d H:M:S');
                            await database.query("update tb_atendimento set datahora_fila = '" + data + "', grupo_id = "+grupoEstorno[0][0].id+" where id = " + atendimento.id);
                            // console.log('tenho o agente na ura');
                            atendimento.grupo_id = grupoEstorno[0][0].id;
                            atendimento.preAtendimento = true;
                            atendimento.datahora_fila = data;
                            atendimento.retirar_pendente = true;
                            await setAgenteAtendimento(agente, atendimento);
                            Log('Atendimento com id ' + atm.id + ' foi redirecionado da ura para grupo de transboard com id ' + grupoEstorno[0][0].id);
                        }
                    }

                    // let temAgentesLogadosGE: any = await database.query("select * from tb_agente_login where grupos_id = "+grupoEstorno[0][0].id+" and datahora_logout is null");
                    // console.log('tem agentes no grupo estorno: ',temAgentesLogadosGE[0][0]);
                    // if (temAgentesLogadosGE[0][0]) {
                    //     let dt = dataTempo.create();
                    //     let data = dt.format('Y-m-d H:M:S');
                    //     let atendimento = await getAtendimentoById(atm.id);
                    //     atendimento.grupo_id = grupoEstorno[0][0].id;
                    //     atendimento.preAtendimento = true;
                    //     atendimento.datahora_fila = data;
                    //     await database.query("update tb_atendimento set datahora_fila = '" + data + "' where id = " + atendimento.id);
                    //     // console.log(atendimento);
                    //     checkAgenteDisponivel(atendimento);
                    //     Log('Atendimento com id ' + atm.id + ' foi redirecionado para grupo de estorno com id ' + grupoEstorno[0][0].id);
                    // } 
                }
            }
            
        }
    }
}

export const transboardFila = async () => {
    // console.log('transboardFila');
    let agenteId = -1;
    let qtdAtend = 0;
    let qtdTotalAtend = 0;

    let listaAtendimentos: any = await database.query("SELECT a.*, TIMESTAMPDIFF(MINUTE,a.datahora_fila,NOW()) as diferenca from tb_atendimento a "+
                                                      "where a.datahora_fila is not null and a.datahora_atendimento is null and a.datahora_fim is null");
    // console.log('lista atm estorno fila: ',listaAtendimentos[0]);
    if (listaAtendimentos[0][0]) {
        for (let index = 0; index < listaAtendimentos[0].length; index++) {
            const atm = listaAtendimentos[0][index];
            let remetente = await getRemetenteById(atm.remetente_id);
            let atendimentoFila = await getAtendimentoById(atm.id);
            if (remetente.config.permitir_grupo_estorno == 1) {
                // transferir para o grupo de estorno na ura ok
                if (atm.diferenca >= remetente.config.tempo_redirecionar_grupo_estorno) {
                    let grupoEstorno: any = await database.query("SELECT * from tb_grupo where grupo_estorno = 'True' and empresa_id = " + atm.empresa_id);
                    // console.log('grupo de transborde id: ',grupoEstorno[0][0].id);

                    let listAgentes: any = await database.query("SELECT agente_id from tb_grupo_agente where grupo_id = "+grupoEstorno[0][0].id);
                    // console.log('lista de id agentes transboard fila: ',listAgentes[0][0])
                    if (listAgentes[0][0]) {
                        for (let index = 0; index < listAgentes[0].length; index++) {
                            const element = listAgentes[0][index];
                            let agente = await getAgenteById(element.agente_id);
                            if (agente) {
                                if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo) continue;
                                if (agente.pausa_programada || agente.pausa) continue;
                                if (agenteId == -1) {
                                    agenteId = agente.id;
                                    qtdAtend = agente.qtdEmAtendimento;
                                    qtdTotalAtend = agente.qtdAtendimentos;
                                }
                                if ((agente.qtdEmAtendimento < qtdAtend) || (agente.qtdEmAtendimento == qtdAtend && agente.qtdAtendimentos < qtdTotalAtend)) {
                                    agenteId = agente.id;
                                    qtdAtend = agente.qtdEmAtendimento;
                                    qtdTotalAtend = agente.qtdAtendimentos;
                                }

                                // console.log('agenteId: ',agenteId);
                            }                
                        }

                        if (agenteId >= 0) {
                            const agente = await getAgenteById(agenteId);
                            await database.query("update tb_atendimento set grupo_id = "+grupoEstorno[0][0].id+" where id = " + atendimentoFila.id);
                            // console.log('tenho o agente na fila');
                            atendimentoFila.grupo_id = grupoEstorno[0][0].id;
                            atendimentoFila.preAtendimento = true;
                            atendimentoFila.retirar_pendente = true;
                            await setAgenteAtendimento(agente, atendimentoFila);
                            Log('Atendimento com id ' + atm.id + ' foi redirecionado da fila para grupo de transboard com id ' + grupoEstorno[0][0].id);
                        }
                    }

                    // let temAgentesLogadosGE: any = await database.query("select * from tb_agente_login where grupos_id in ('"+grupoEstorno[0][0].id+"') and datahora_logout is null");
                    // // console.log('tem agentes no grupo estorno: ',temAgentesLogadosGE[0]);
                    // if (temAgentesLogadosGE[0][0]) {
                    //     let atendimento = await getAtendimentoById(atm.id);
                    //     atendimento.grupo_id = grupoEstorno[0][0].id;
                    //     atendimento.preAtendimento = true;
                    //     // console.log(atendimento);
                    //     checkAgenteDisponivel(atendimento);
                    //     Log('Atendimento com id ' + atm.id + ' foi redirecionado para grupo de estorno com id ' + grupoEstorno[0][0].id);
                    // }                    
                }
            }
        }
    }
}