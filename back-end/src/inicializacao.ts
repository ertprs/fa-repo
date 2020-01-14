import { 
    handleDisconnect 
} from './libs/conexao';
import { 
    Remetente, 
    addRemetente, 
    RemetenteTipo
} from './models/remetente-model';
import { 
    getBrowser, 
    getConfig, 
} from './controllers/remetente-controller';
import { 
    Log, 
    GetFileCode
} from './globais/logs';
import { 
    Atendimento, 
    addAtendimento 
} from './models/atendimento-model';
import { getCliente } from './controllers/atendimento-controller';
import { getAgenteById } from './models/agente-model';
import { 
    HorariosFuncionamento, 
    addHorariosFuncionamento,
    DatasFeriados,
    addDatasFeriados
} from './models/horario-funcionamento-model';

import * as dataTempo from "node-datetime";

import {execSQL} from './globais/dbconn';


export default async (remetente_id?: number) => {
    // console.log('remetentet: ',remetente_id)
    await handleDisconnect();


    //Carregando remetentes
    Log('Inicializando remetentes...');
    let sRemetentes: any = await execSQL("SELECT r.*, ifnull(gr.grupo_id,0) as grupo_id, ifnull(g.nome, '') as grupo_nome FROM " +
        "tb_remetente r left join tb_grupo_remetente gr on r.id = gr.remetente_id   left join  " +
        "tb_grupo g on g.id = gr.grupo_id where r.`status` <> 'DESATIVADO' " + (remetente_id ? " and r.id = " + remetente_id : " group by r.id "));


    if (!sRemetentes![0]) return;

    for (let index = 0; index < sRemetentes.length; index++) {
        const item = sRemetentes[index];
        Log('Carregando o remetente "' + item.id + '"...');
        const remetente: Remetente = {
            id: item.id,
            empresa_id: item.empresa_id,
            descricao: item.descricao,
            grupo_id: item.grupo_id,
            grupo_nome: item.grupo_nome,
            tipo: (item.tipo == 'WHATSAPP' ? RemetenteTipo.WHATSAPP : (item.tipo == 'FACEBOOK' ? RemetenteTipo.FACEBOOK : RemetenteTipo.WEB)),
            // status: 'DESCONECTADO',
            status: (item.tipo == 'FACEBOOK' ? 'CONECTADO' : 'DESCONECTADO'),
            remetente: item.remetente,
            palavra_chave: item.palavra_chave,
            impulsionar: item.impulsionar,
            redirect: item.redirect,
            mynumber: item.mynumber,
            token: item.token,
            tipo_phone_whatsapp: item.whatsapp_fixo_movel
        }
         
        if (remetente.tipo == RemetenteTipo.WHATSAPP) {
            await getBrowser(remetente);
            Log('Navegador e Página inicializada!');
        }

        await getConfig(remetente);
        await addRemetente(remetente);
        // if (remetente.tipo == RemetenteTipo.FACEBOOK)
        //     await loginFacebook(remetente);
    }


    if (remetente_id) return;

    //logout agentes
    await execSQL("update tb_agente_login set datahora_logout = now() where datahora_logout is null");

    //remover os agentes dos atendimentos
    await execSQL("update tb_atendimento set agente_id = null where datahora_fim is null "+
                         " and (select atendimento_fixo_agente from tb_config where empresa_id = tb_atendimento.empresa_id limit 1) = 'False'");

    // remove qtd de atendimentos do agente no banco                        
    await execSQL("update tb_usuario set qtd_atendimentos = 0 where "+  
                         "(select atendimento_fixo_agente from tb_config where empresa_id = tb_usuario.empresa_id limit 1) = 'False'");


    //Carregando Atendimentos
    Log('Inicializando atendimentos...');
    let sAtendimentos: any = await execSQL("select a.* from tb_atendimento a where a.datahora_fim is null");

    if (sAtendimentos![0]) {
        for (let index = 0; index < sAtendimentos.length; index++) {
            const item = sAtendimentos[index];
            Log('Carregando o atendimento "' + item.id + '"...');
            
            let dt_inicio = dataTempo.create(item.datahora_inicio);
            let dt_fila = dataTempo.create(item.datahora_fila);
            let dt_atendimento = dataTempo.create(item.datahora_atendimento);
            item.datahora_inicio = dt_inicio.format("Y-m-d H:M:S");
            item.datahora_fila = dt_fila.format("Y-m-d H:M:S");
            item.datahora_atendimento = dt_atendimento.format("Y-m-d H:M:S");

            const atendimento: Atendimento = {
                id: item.id,
                empresa_id: item.empresa_id,
                grupo_id: item.grupo_id,
                remetente_id: item.remetente_id,
                agente_id: item.agente_id,
                chave: item.cliente_chave,
                tipo: item.tipo,
                preAtendimento: true,
                emEntendimento: false,
                protocolo: item.protocolo,
                datahora_inicio: item.datahora_inicio,
                datahora_fila: item.datahora_fila,
                datahora_atendimento: item.datahora_atendimento,
                intervencao_supervisor_id: item.intervencao_supervisor_id,
                intervencao: (item.intervencao ? item.intervencao : 'False'),
                liberar_intervencao: (item.liberar_intervencao ? item.liberar_intervencao : 'False'),
                inicio_atm: true
            }
            // TOHEN: (ACREDITO QUE ESTEJA DUPLICANDO OS ATENDIMENTOS)
            // if (atendimento.agente_id > 0) {
            //     let agente = await getAgenteById(atendimento.agente_id);
            //     if (agente){
            //         agente.qtdEmAtendimento++;
            //         await execSQL("update tb_usuario set qtd_atendimentos=qtd_atendimentos+1 where id=" + agente.id);
            //     }  
            // }

            await getCliente(atendimento, item.cliente_id);
            await addAtendimento(atendimento);
        }
    }


    //carregando horarios de funcionamentos
    Log('Iniciando o carregamento dos Horários de Funcionamento'+'\n    File Info: '+GetFileCode());
    let sHorariosFuncionamentos: any = await execSQL("select * from tb_horarios_funcionamentos");

    if (sHorariosFuncionamentos[0]) {
        for (let index = 0; index < sHorariosFuncionamentos.length; index++) {
            const item = sHorariosFuncionamentos[index];
            Log('Carregando o Horário de Funcionamento com id: '+item.id+'\n    File Info: '+GetFileCode());

            const horarioFuncionamento: HorariosFuncionamento = {
                id: item.id,
                empresa_id: item.empresa_id,
                tronco_id: item.tronco_id,
                dia_semana: item.dia_semana,
                hora_inicio: item.hora_inicio,
                hora_fim: item.hora_fim,
                mensagem: item.mensagem,
                ativo: item.ativo
            }      
            
            // console.log('horarioFuncionamento: ',horarioFuncionamento);
            await addHorariosFuncionamento(horarioFuncionamento);
        }
    }

    //carregando datas e feriados
    Log('Iniciando o carregamento das Datas e Feriados');
    let sDatasFeriados: any = await execSQL("select * from tb_datas_feriados");

    if (sDatasFeriados[0]) {
        for (let index = 0; index < sDatasFeriados.length; index++) {
            const item = sDatasFeriados[index];
            Log('Carregando as Datas e Feriados com id: '+item.id);
            
            const datasFeriados: DatasFeriados = {
                id: item.id,
                empresa_id: item.empresa_id,
                tronco_id: item.tronco_id,
                datahora_inicio: item.datahora_inicio,
                datahora_fim: item.datahora_fim,
                mensagem: item.mensagem,
                ativo: item.ativo
            }

            await addDatasFeriados(datasFeriados);
        }
    }


} 