"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const conexao_1 = require("./libs/conexao");
const remetente_model_1 = require("./models/remetente-model");
const remetente_controller_1 = require("./controllers/remetente-controller");
const logs_1 = require("./globais/logs");
const atendimento_model_1 = require("./models/atendimento-model");
const atendimento_controller_1 = require("./controllers/atendimento-controller");
const horario_funcionamento_model_1 = require("./models/horario-funcionamento-model");
const dataTempo = require("node-datetime");
const dbconn_1 = require("./globais/dbconn");
exports.default = (remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('remetentet: ',remetente_id)
    yield conexao_1.handleDisconnect();
    //Carregando remetentes
    logs_1.Log('Inicializando remetentes...');
    let sRemetentes = yield dbconn_1.execSQL("SELECT r.*, ifnull(gr.grupo_id,0) as grupo_id, ifnull(g.nome, '') as grupo_nome FROM " +
        "tb_remetente r left join tb_grupo_remetente gr on r.id = gr.remetente_id   left join  " +
        "tb_grupo g on g.id = gr.grupo_id where r.`status` <> 'DESATIVADO' " + (remetente_id ? " and r.id = " + remetente_id : " group by r.id "));
    if (!sRemetentes[0])
        return;
    for (let index = 0; index < sRemetentes.length; index++) {
        const item = sRemetentes[index];
        logs_1.Log('Carregando o remetente "' + item.id + '"...');
        const remetente = {
            id: item.id,
            empresa_id: item.empresa_id,
            descricao: item.descricao,
            grupo_id: item.grupo_id,
            grupo_nome: item.grupo_nome,
            tipo: (item.tipo == 'WHATSAPP' ? remetente_model_1.RemetenteTipo.WHATSAPP : (item.tipo == 'FACEBOOK' ? remetente_model_1.RemetenteTipo.FACEBOOK : remetente_model_1.RemetenteTipo.WEB)),
            // status: 'DESCONECTADO',
            status: (item.tipo == 'FACEBOOK' ? 'CONECTADO' : 'DESCONECTADO'),
            remetente: item.remetente,
            palavra_chave: item.palavra_chave,
            impulsionar: item.impulsionar,
            redirect: item.redirect,
            mynumber: item.mynumber,
            token: item.token,
            tipo_phone_whatsapp: item.whatsapp_fixo_movel
        };
        if (remetente.tipo == remetente_model_1.RemetenteTipo.WHATSAPP) {
            yield remetente_controller_1.getBrowser(remetente);
            logs_1.Log('Navegador e Página inicializada!');
        }
        yield remetente_controller_1.getConfig(remetente);
        yield remetente_model_1.addRemetente(remetente);
        // if (remetente.tipo == RemetenteTipo.FACEBOOK)
        //     await loginFacebook(remetente);
    }
    if (remetente_id)
        return;
    //logout agentes
    yield dbconn_1.execSQL("update tb_agente_login set datahora_logout = now() where datahora_logout is null");
    //remover os agentes dos atendimentos
    yield dbconn_1.execSQL("update tb_atendimento set agente_id = null where datahora_fim is null " +
        " and (select atendimento_fixo_agente from tb_config where empresa_id = tb_atendimento.empresa_id limit 1) = 'False'");
    // remove qtd de atendimentos do agente no banco                        
    yield dbconn_1.execSQL("update tb_usuario set qtd_atendimentos = 0 where " +
        "(select atendimento_fixo_agente from tb_config where empresa_id = tb_usuario.empresa_id limit 1) = 'False'");
    //Carregando Atendimentos
    logs_1.Log('Inicializando atendimentos...');
    let sAtendimentos = yield dbconn_1.execSQL("select a.* from tb_atendimento a where a.datahora_fim is null");
    if (sAtendimentos[0]) {
        for (let index = 0; index < sAtendimentos.length; index++) {
            const item = sAtendimentos[index];
            logs_1.Log('Carregando o atendimento "' + item.id + '"...');
            let dt_inicio = dataTempo.create(item.datahora_inicio);
            let dt_fila = dataTempo.create(item.datahora_fila);
            let dt_atendimento = dataTempo.create(item.datahora_atendimento);
            item.datahora_inicio = dt_inicio.format("Y-m-d H:M:S");
            item.datahora_fila = dt_fila.format("Y-m-d H:M:S");
            item.datahora_atendimento = dt_atendimento.format("Y-m-d H:M:S");
            const atendimento = {
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
            };
            // TOHEN: (ACREDITO QUE ESTEJA DUPLICANDO OS ATENDIMENTOS)
            // if (atendimento.agente_id > 0) {
            //     let agente = await getAgenteById(atendimento.agente_id);
            //     if (agente){
            //         agente.qtdEmAtendimento++;
            //         await execSQL("update tb_usuario set qtd_atendimentos=qtd_atendimentos+1 where id=" + agente.id);
            //     }  
            // }
            yield atendimento_controller_1.getCliente(atendimento, item.cliente_id);
            yield atendimento_model_1.addAtendimento(atendimento);
        }
    }
    //carregando horarios de funcionamentos
    logs_1.Log('Iniciando o carregamento dos Horários de Funcionamento' + '\n    File Info: ' + logs_1.GetFileCode());
    let sHorariosFuncionamentos = yield dbconn_1.execSQL("select * from tb_horarios_funcionamentos");
    if (sHorariosFuncionamentos[0]) {
        for (let index = 0; index < sHorariosFuncionamentos.length; index++) {
            const item = sHorariosFuncionamentos[index];
            logs_1.Log('Carregando o Horário de Funcionamento com id: ' + item.id + '\n    File Info: ' + logs_1.GetFileCode());
            const horarioFuncionamento = {
                id: item.id,
                empresa_id: item.empresa_id,
                tronco_id: item.tronco_id,
                dia_semana: item.dia_semana,
                hora_inicio: item.hora_inicio,
                hora_fim: item.hora_fim,
                mensagem: item.mensagem,
                ativo: item.ativo
            };
            // console.log('horarioFuncionamento: ',horarioFuncionamento);
            yield horario_funcionamento_model_1.addHorariosFuncionamento(horarioFuncionamento);
        }
    }
    //carregando datas e feriados
    logs_1.Log('Iniciando o carregamento das Datas e Feriados');
    let sDatasFeriados = yield dbconn_1.execSQL("select * from tb_datas_feriados");
    if (sDatasFeriados[0]) {
        for (let index = 0; index < sDatasFeriados.length; index++) {
            const item = sDatasFeriados[index];
            logs_1.Log('Carregando as Datas e Feriados com id: ' + item.id);
            const datasFeriados = {
                id: item.id,
                empresa_id: item.empresa_id,
                tronco_id: item.tronco_id,
                datahora_inicio: item.datahora_inicio,
                datahora_fim: item.datahora_fim,
                mensagem: item.mensagem,
                ativo: item.ativo
            };
            yield horario_funcionamento_model_1.addDatasFeriados(datasFeriados);
        }
    }
});
//# sourceMappingURL=inicializacao.js.map