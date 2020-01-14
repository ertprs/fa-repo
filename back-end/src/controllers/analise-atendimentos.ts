import { database } from './../libs/conexao'; 
import { Log } from './../globais/logs';
import { getRemetenteById } from './../models/remetente-model';
import { getTodosAtendimentosNaoAtendidos } from './../models/atendimento-model';
import { setAgenteAtendimento } from './atendimento-controller';
import { getAgentForSetAtt, getAgenteById } from './../models/agente-model';

export const AnaliseAtendimentosPendentes = async () => {
    console.log("FUNCTION: AnaliseAtendimentosPendentes: ##############################");
    let atendimentos = await getTodosAtendimentosNaoAtendidos();
    if(atendimentos){ 
        for (let index = 0; index < atendimentos.length; index++) {
            const atendimento = atendimentos[index];
            let remetente = await getRemetenteById(atendimento.remetente_id);
            let agentes = await getAgentForSetAtt(atendimento.empresa_id, remetente.config.qtd_atendimento_simultaneo);

            if(agentes){
                if (remetente.config.permitir_ura == '0') {
                    await setAgenteAtendimento(agentes[0], atendimento);
                } else {
                    if(atendimento.datahora_fila){
                        let sArray_id: string = '';
                        for (let index = 0; index < agentes.length; index++) {
                            const agente = agentes[index];
                            let separador: string = '';
    
                            if (sArray_id == ''){
                                separador = '';
                            } else {
                                separador = ',';
                            }
    
                            sArray_id = sArray_id+separador+agente.id;                       
                        }
     
                        if (sArray_id != ''){
                            let agtResult = await database.query("select agente_id from tb_grupo_agente where agente_id in ("+sArray_id+") and grupo_id = "+atendimento.grupo_id+" order by field(agente_id, "+sArray_id+") limit 1");
    
                            if (agtResult[0][0]){
                                let agente = await getAgenteById(agtResult[0][0].agente_id);
                                if(agente){
                                    await setAgenteAtendimento(agente, atendimento);
                                }
                                
                            }
                        }
                    }
                  

                }
                

            }

            
        }

    }


}
