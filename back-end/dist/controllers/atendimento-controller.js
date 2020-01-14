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
const agente_model_1 = require("./../models/agente-model");
const atendimento_model_1 = require("./../models/atendimento-model");
const conexao_1 = require("./../libs/conexao");
const logs_1 = require("./../globais/logs");
const dataTempo = require("node-datetime");
const remetente_model_1 = require("./../models/remetente-model");
const io_1 = require("./../libs/io");
const mensagem_service_1 = require("./mensagem-service");
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
exports.removeAgenteAtendimento = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('##### REMOÇÃO DO AGENTE ' + agente.id + ' DOS ATENDIMENTOS');
    let listaAtendimentos = yield atendimento_model_1.getAtendimentosByAgenteId(agente.id);
    for (let index = 0; index < listaAtendimentos.length; index++) {
        const atendimento = listaAtendimentos[index];
        // verificar se remove o agente de forma automatica ou manual
        let tronco = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
        // se remove ou não agente do atendimento
        if (tronco.config.atendimento_fixo_agente == 'False') {
            if (tronco.config.remover_agente_atendimento == 'True') {
                logs_1.Log('Inicio de espera de ' + tronco.config.tempo_remover_agente_atendimento + ' minuto para remoção do agente ' + agente.id + ' no atendimento ' + atendimento.id + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
                yield setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    // Log('Agente removido ' + agente.id + ' do atendimento ' + atendimento.id);
                    // ### verificar se agento logou se sim não faz nada ###
                    let existAgent = yield agente_model_1.getAgenteById(agente.id);
                    console.log('preciso ver agente ', existAgent);
                    if (!existAgent) {
                        let sAgente_id = atendimento.agente_id;
                        atendimento.agente_id = 0;
                        atendimento.emEntendimento = false;
                        yield conexao_1.database.query("update tb_atendimento set agente_id = null where id = " + atendimento.id);
                        yield conexao_1.database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + sAgente_id);
                        agente.qtdEmAtendimento--;
                        logs_1.Log('Agente ' + agente.id + ' removido do atendimento ' + atendimento.id + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
                        yield exports.checkAgenteDisponivel(atendimento);
                    }
                }), tronco.config.tempo_remover_agente_atendimento * 30000);
            }
            else {
                console.log('lista de pendentes');
                yield setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    logs_1.Log('Agente ' + agente.id + ' removido do atendimento ' + atendimento.id + ' inserindo atendimento nos pendentes. (Else)' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
                    let sAgente_id = atendimento.agente_id;
                    atendimento.agente_id = 0;
                    atendimento.emEntendimento = false;
                    yield conexao_1.database.query("update tb_atendimento set agente_id = null where id = " + atendimento.id);
                    yield conexao_1.database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + sAgente_id);
                    agente.qtdEmAtendimento--;
                    yield exports.checkAgenteDisponivel(atendimento); //TOHEN
                }), 60000);
            }
        }
        else {
            console.log('atendimeto id: ' + atendimento.id + ' | está fixo ao agente id: ' + agente.id);
        }
    }
});
exports.finalizaAtendimento = (atendimento, clienteFinalizou) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("update tb_atendimento set datahora_fim = '" + data + "', cliente_finalizou = '" + (clienteFinalizou ? 'True' : 'False') + "' where" +
        " id = " + atendimento.id);
    let agente = yield agente_model_1.getAgenteById(atendimento.agente_id);
    let supervisor_id = 0;
    if (clienteFinalizou == true && atendimento.liberar_intervencao == 'True') {
        supervisor_id = atendimento.intervencao_supervisor_id;
    }
    yield atendimento_model_1.delAtendimento(atendimento);
    if (agente) {
        agente.qtdEmAtendimento = (agente.qtdEmAtendimento > 0 ? agente.qtdEmAtendimento - 1 : 0);
        yield conexao_1.database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + agente.id);
        yield exports.checkAtendimentos(agente, false);
    }
    io_1.io.emit('atendimentoFinalizado', JSON.stringify({
        usuario_id: atendimento.agente_id,
        protocolo: atendimento.protocolo,
        supervisor_id: supervisor_id
    }));
    logs_1.Log('Atendimento "' + atendimento.id + '" finalizado!' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
    yield conexao_1.database.query("insert into tb_mensagem (atendimento_id, origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id, base64file, file_name, type_file, exists_image, " +
        " exists_document, type_mensagem) values (" + atendimento.id + "," + "'" + (clienteFinalizou ? 'CLIENTE' : 'AGENTE') + "', " + (clienteFinalizou ? atendimento.cliente.id : atendimento.agente_id) + ", " +
        "'" + data + "','Atendimento Finalizado pelo: " + (clienteFinalizou ? 'Cliente' : 'Agente') + "', " + atendimento.empresa_id + ", '" + atendimento.chave + "', " + (clienteFinalizou ? "'" + atendimento.chave + "'" : 'null') + ", " +
        " '',  '', '', 'False', 'False', 'texto')");
});
exports.checkClienteWA = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let dadoCliente = yield conexao_1.database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    let tronco = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    if (dadoCliente[0][0]) {
        if (tronco.config.atualizar_nome_contato == 'True') {
            yield conexao_1.database.query("update tb_cliente set telefone = '" + atendimento.numero + "', nome = '" + atendimento.nome +
                "', whatsapp_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
                "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
                "  where whatsapp_id = '" + atendimento.chave + "' " +
                " and empresa_id = " + atendimento.empresa_id);
        }
        else {
            yield conexao_1.database.query("update tb_cliente set telefone = '" + atendimento.numero +
                "', whatsapp_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
                "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
                "  where whatsapp_id = '" + atendimento.chave + "' " +
                " and empresa_id = " + atendimento.empresa_id);
        }
        dadoCliente = yield conexao_1.database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    else {
        conexao_1.database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadoCliente = yield conexao_1.database.query("select * from tb_cliente where whatsapp_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
        //inserir a tb_contato do usuario
    }
    atendimento.cliente = dadoCliente[0][0];
});
exports.checkCliente = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let dadoCliente = yield conexao_1.database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    if (dadoCliente[0][0]) {
        yield conexao_1.database.query("update tb_cliente set telefone = '" + atendimento.numero +
            "' where cpf = '" + atendimento.cpf + "' " +
            " and empresa_id = " + atendimento.empresa_id);
        dadoCliente = yield conexao_1.database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    else {
        yield conexao_1.database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadoCliente = yield conexao_1.database.query("select * from tb_cliente where cpf = '" + atendimento.cpf + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    atendimento.cliente = dadoCliente[0][0];
});
exports.getCliente = (atendimento, cliente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dadoCliente = yield conexao_1.database.query("select * from tb_cliente where id = " + cliente_id +
        " and empresa_id = " + atendimento.empresa_id);
    // console.log('dados do cliente: ' + dadoCliente[0]);
    if (dadoCliente[0][0]) {
        // console.log('entrei dados do cliente');
        atendimento.nome = dadoCliente[0][0].nome;
        atendimento.cpf = dadoCliente[0][0].cpf;
        atendimento.cliente = dadoCliente[0][0];
    }
});
exports.iniciaAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('numero do protocolo: ' + atendimento.protocolo);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    // Testar isso (DPHX)
    // let oAtendimento: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
    //     "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc");
    // console.log('oAtendimento iniciado !================================');
    // console.log(oAtendimento);
    let dadoAtendimento = yield conexao_1.database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
        "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc limit 1");
    // console.log('dados do atendimento: ' + dadoAtendimento[0][0]);
    if (dadoAtendimento[0][0]) {
        if (!dadoAtendimento[0][0].datahora_fila) {
            yield conexao_1.database.query("update tb_atendimento set datahora_fila = '" + atendimento.datahora_fila + "' where protocolo = '" + atendimento.protocolo + "' ");
        }
    }
    else {
        // atendimento.datahora_fila = (atendimento.datahora_fila ? atendimento.datahora_fila : data);
        // console.log('grava arquivo atendimento pelo protocolo ver grupo id: ',atendimento);
        yield conexao_1.database.query("insert into tb_atendimento (protocolo, datahora_inicio, grupo_id, ura_id, empresa_id, tipo, cliente_id, remetente_id, cliente_chave) values ('" +
            atendimento.protocolo + "', '" + atendimento.datahora_inicio + "', " + atendimento.grupo_id + ", " + (atendimento.ura_id ? atendimento.ura_id : 0) + ", " + atendimento.empresa_id +
            ", '" + atendimento.tipo + "', " + atendimento.cliente.id + ", " + atendimento.remetente_id + ", '" + atendimento.chave + "');");
        let atendimentoId = yield conexao_1.database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo +
            "' and grupo_id = '" + atendimento.grupo_id + "' order by id desc limit 1");
        // console.log('new id of the atendimento: ' + atendimentoId[0][0].id);
        atendimento.id = atendimentoId[0][0].id;
        logs_1.Log('Novo Atendimento gravado no banco| ID: "' + atendimento.id + '"' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
    }
});
exports.updateDataHoraFilaAtendimento = (atendimento_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("update tb_atendimento set datahora_fila = '" + data + "' where id = " + atendimento_id);
});
exports.checkAgenteDisponivel = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("FUNCTION: checkAgenteDisponivel: ##############################");
    // console.log(atendimento);
    let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    // let listaAgente = await getAgentesByGrupoId(atendimento.grupo_id);   
    let agenteId = -1;
    let qtdAtend = 0;
    let qtdTotalAtend = 0;
    // GAMBIARRA DO CARLOS ##################################################################################################
    let listAgentes = yield conexao_1.database.query("SELECT agente_id from tb_grupo_agente where grupo_id = " + atendimento.grupo_id);
    if (listAgentes[0].length > 0) {
        for (let index = 0; index < listAgentes[0].length; index++) {
            const element = listAgentes[0][index];
            let agente = yield agente_model_1.getAgenteById(element.agente_id);
            if (agente) {
                if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo)
                    continue;
                if (agente.pausa_programada || agente.pausa)
                    continue;
                if (agente.empresa_id != atendimento.empresa_id)
                    continue;
                if (agenteId == -1) {
                    agenteId = agente.id;
                    qtdAtend = agente.qtdEmAtendimento;
                    qtdTotalAtend = agente.qtdAtendimentos;
                }
                if ((agente.qtdEmAtendimento <= qtdAtend) || (agente.qtdEmAtendimento == qtdAtend && agente.qtdAtendimentos < qtdTotalAtend)) {
                    agenteId = agente.id;
                    qtdAtend = agente.qtdEmAtendimento;
                    qtdTotalAtend = agente.qtdAtendimentos;
                }
            }
        }
        if (agenteId >= 0) {
            const agente = yield agente_model_1.getAgenteById(agenteId);
            console.log('tenho o agente');
            atendimento.retirar_pendente = true;
            yield exports.setAgenteAtendimento(agente, atendimento);
        }
    }
});
exports.setAgenteAtendimento = (agente, atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("FUNCTION: setAgenteAtendimento: ##############################");
    if (agente.empresa_id != atendimento.empresa_id) {
        // checkAgenteDisponivel(atendimento);
        console.log('### Erro no atendimento, sem empresa: agente:' + agente.empresa_id + " - atendimento" + atendimento.empresa_id);
        return;
    }
    else
        console.log('agente creditado a atender o atendimento');
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    // console.log(atendimento);
    if (atendimento.timeout_aguarda_agente) {
        clearTimeout(atendimento.timeout_aguarda_agente);
        logs_1.Log('Cancelado espera do agente ' + atendimento.agente_id + ' no atendimento ' + atendimento.id + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
    }
    let intervencaoSupervisor = (atendimento.intervencao ? atendimento.intervencao : 'False');
    let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    if (atendimento.agente_id && agente.id == atendimento.agente_id && (!atendimento.tranfer_new)) {
        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : data);
        io_1.io.emit('atendimentoBegin', JSON.stringify({
            usuario_id: agente.id,
            remetente_id: atendimento.remetente_id,
            tronco: remetente.descricao,
            cliente_id: atendimento.cliente.id,
            cliente_nome: (remetente.config.atualizar_nome_contato == 'False' ? (atendimento.cliente.nome ? atendimento.cliente.nome : atendimento.nome) : atendimento.nome),
            cliente_cpf: atendimento.cliente.cpf,
            cliente_telefone: atendimento.cliente.telefone,
            cliente_email: atendimento.cliente.email,
            avatar: atendimento.cliente.whatsapp_url_avatar,
            protocolo: atendimento.protocolo,
            atendimento_id: atendimento.id,
            id: atendimento.id,
            datahora_inicio: atendimento.datahora_inicio,
            datahora_fila: atendimento.datahora_fila,
            tipo: atendimento.tipo,
            intervencao: intervencaoSupervisor,
            liberar_intervencao: atendimento.liberar_intervencao,
            atm_finalizado: false
        }));
        console.log('atendimentoBegin:' + atendimento.id);
        atendimento.agente_id = agente.id;
        atendimento.emEntendimento = true;
        console.log('atm atendido pelo agente id: ', atendimento.agente_id);
    }
    else {
        let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
        if (atendimento.datahora_atendimento) {
            yield conexao_1.database.query("update tb_atendimento set agente_id = '" + agente.id + "' where id = " + atendimento.id);
        }
        else {
            yield conexao_1.database.query("update tb_atendimento set datahora_atendimento = '" + data +
                "', agente_id = '" + agente.id + "' where id = " + atendimento.id);
        }
        let msgAgente = false;
        msgAgente = (atendimento.datahora_atendimento ? true : false);
        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : data);
        atendimento.datahora_atendimento = (atendimento.datahora_atendimento ? atendimento.datahora_atendimento : dt._now);
        atendimento.agente_id = agente.id;
        atendimento.emEntendimento = true;
        logs_1.Log('Agente "' + agente.id + '" setado ao atendimento "' + atendimento.id + '"!' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
        io_1.io.emit('atendimentoBegin', JSON.stringify({
            usuario_id: agente.id,
            remetente_id: atendimento.remetente_id,
            tronco: remetente.descricao,
            cliente_id: atendimento.cliente.id,
            cliente_nome: (remetente.config.atualizar_nome_contato == 'False' ? (atendimento.cliente.nome ? atendimento.cliente.nome : atendimento.nome) : atendimento.nome),
            cliente_cpf: atendimento.cliente.cpf,
            cliente_telefone: atendimento.cliente.telefone,
            cliente_email: atendimento.cliente.email,
            avatar: atendimento.cliente.whatsapp_url_avatar,
            protocolo: atendimento.protocolo,
            atendimento_id: atendimento.id,
            id: atendimento.id,
            datahora_inicio: atendimento.datahora_inicio,
            datahora_fila: atendimento.datahora_fila,
            tipo: atendimento.tipo,
            intervencao: intervencaoSupervisor,
            liberar_intervencao: atendimento.liberar_intervencao,
            atm_finalizado: false
        }));
        console.log('atendimentoBegin:' + atendimento.id);
        let messeger = remetente.config.msg_boasvindas_agente.replace('{agente}', agente.nome);
        //novos campos: base64file file_name type_file exists_image exists_document
        console.log('remetente.config.permitir_enviar_mensagem_troca_agente: ', remetente.config.permitir_enviar_mensagem_troca_agente);
        console.log('msgAgente: ', msgAgente);
        if (remetente.config.permitir_enviar_mensagem_troca_agente == 'True' && msgAgente) {
            yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', messeger, 'CI_' + atendimento.agente_id + '_' + data, atendimento.agente_id, data, '', '', '', 'False', 'False', 'texto', 'null');
        }
        else if (!msgAgente) {
            yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', messeger, 'CI_' + atendimento.agente_id + '_' + data, atendimento.agente_id, data, '', '', '', 'False', 'False', 'texto', 'null');
        }
    }
    agente.qtdEmAtendimento++;
    agente.qtdAtendimentos++;
    yield conexao_1.database.query("update tb_usuario set qtd_atendimentos=qtd_atendimentos+1 where id=" + agente.id);
    logs_1.Log('Atendimento "' + atendimento.id + '" atendido pelo agente "' + agente.id + '".' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
});
exports.checkAtendimentos = (agente, getAtendimentosEmCurso) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("FUNCTION: checkAtendimentos: ##############################");
    let remetente = yield remetente_model_1.getFirstRemetenteByEmpresaId(agente.empresa_id);
    console.log('grupo do agente: ', agente.grupo_id);
    if (getAtendimentosEmCurso) {
        let listaAtendimentosEmCurso = yield atendimento_model_1.getAtendimentosByAgenteId(agente.id);
        for (let index = 0; index < listaAtendimentosEmCurso.length; index++) {
            if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo)
                return;
            const atendimento = listaAtendimentosEmCurso[index];
            // (ALTERAR) (INVERTER IF)
            if (remetente.config.remover_agente_atendimento == 'False'
                && atendimento.datahora_atendimento
                && !atendimento.agente_id
                && atendimento.retirar_pendente == false) {
                // não faz nada
            }
            else
                yield exports.setAgenteAtendimento(agente, atendimento);
        }
    }
    //Verificando atendimentos em aberto
    let listaAtendimentos = yield atendimento_model_1.getAtendimentosNaoAtendidos(agente.empresa_id);
    // console.log('listaAtendimentos: ',listaAtendimentos);
    for (let index = 0; index < listaAtendimentos.length; index++) {
        if (agente.qtdEmAtendimento >= remetente.config.qtd_atendimento_simultaneo)
            return;
        const atendimento = listaAtendimentos[index];
        if (remetente.config.remover_agente_atendimento == 'False'
            && atendimento.datahora_atendimento
            && !atendimento.agente_id
            && atendimento.retirar_pendente == false) {
            // não faz nada
        }
        else
            yield exports.checkAgenteDisponivel(atendimento);
    }
});
exports.getMensagens = (cliente_id, tronco_id, protocolo) => __awaiter(void 0, void 0, void 0, function* () {
    //campo para permitir todas as mensagens: permitir_visualizar_todas_conversas_cliente
    //campo para permitir as mensagens transferidas: permitir_visualizar_conversas_transferida
    let tronco = yield remetente_model_1.getRemetenteById(tronco_id);
    console.log('tronco.config.permitir_visualizar_conversas_7_dias: ', tronco.config.permitir_visualizar_conversas_7_dias);
    console.log('tronco.config.permitir_visualizar_conversas_15_dias: ', tronco.config.permitir_visualizar_conversas_15_dias);
    console.log('tronco.config.permitir_visualizar_conversas_30_dias: ', tronco.config.permitir_visualizar_conversas_30_dias);
    console.log('tronco.config.permitir_visualizar_conversas_transferida: ', tronco.config.permitir_visualizar_conversas_transferida);
    if (tronco.config.permitir_visualizar_conversas_7_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_7_dias
        let dadosMsgs = yield conexao_1.database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
            "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
            "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 7 day))");
        return dadosMsgs[0];
    }
    if (tronco.config.permitir_visualizar_conversas_15_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_15_dias
        let dadosMsgs = yield conexao_1.database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
            "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
            "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 15 day))");
        return dadosMsgs[0];
    }
    if (tronco.config.permitir_visualizar_conversas_30_dias == 'True') {
        //listar todas as mensagens permitir_visualizar_conversas_30_dias
        let dadosMsgs = yield conexao_1.database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
            "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
            "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.datahora_inicio >= DATE(DATE_SUB(NOW(), INTERVAL 30 day))");
        return dadosMsgs[0];
    }
    if (tronco.config.permitir_visualizar_conversas_transferida == 'True') {
        //listar todas as mensagens transferidas
        let dadosMsgs = yield conexao_1.database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
            "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where " +
            "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "' and a.protocolo = '" + protocolo + "'");
        return dadosMsgs[0];
    }
    else {
        let dadosMsgs = yield conexao_1.database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
            "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where a.datahora_fim is null and " +
            "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "'");
        return dadosMsgs[0];
    }
    // let dadosMsgs: any = await database.query("select a.agente_id, a.cliente_id, a.id, a.protocolo, a.intervencao, m.mensagem_id, m.origem, m.origem_id, m.datahora_envio," +
    //     "m.mensagem, a.empresa_id, c.nome as nome_cliente, m.base64file, m.type_mensagem from tb_mensagem m, tb_cliente c, tb_atendimento a where date(a.datahora_inicio) = date(now()) and " +
    //     "a.id = m.atendimento_id and c.id = a.cliente_id and a.cliente_id = '" + cliente_id + "'");
});
// create method to list of ura
exports.reqListUraWA = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conexao_1.database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
});
exports.reqIdGrupoUra = (ura_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield conexao_1.database.query("select * from tb_grupo_ura where ura_id = '" + ura_id + "'");
});
exports.updateAtendimentoUraId = (antendimento_id, ura_id, grupo_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield conexao_1.database.query("update tb_atendimento set ura_id = '" + ura_id + "', grupo_id = '" + grupo_id + "' where id = '" + antendimento_id + "' ");
    return true;
});
exports.reqListUra = (empresa_id, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let dadosUra = yield conexao_1.database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
    // console.log('dados ura: ' +  JSON.stringify(dadosUra[0]));
    // socket.emit('respListUra', JSON.stringify(dadosUra[0]));
});
exports.clienteLogin = (cliente, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create(cliente.data_inicio.toString());
    let data = dt.format('Y-m-d H:M:S');
    // get grupo_id with ura_id
    let grupoIdRetorno = yield conexao_1.database.query("select grupo_id from tb_grupo_ura where ura_id = '" + cliente.ura_id + "' LIMIT 1");
    let grupoId = (grupoIdRetorno[0][0] ? grupoIdRetorno[0][0].grupo_id : null);
    if (!grupoId) {
        let tronco = yield remetente_model_1.getRemetenteById(cliente.remetente_id);
        grupoId = tronco.grupo_id;
    }
    let atendimento = yield atendimento_model_1.getAtendimentoByCPF(cliente.cpf);
    if (!atendimento) {
        atendimento = {
            id: 0,
            emEntendimento: false,
            chave: socket.id,
            nome: cliente.nome,
            numero: cliente.telefone,
            avatar: '',
            nivel: 0,
            empresa_id: cliente.empresa_id,
            grupo_id: grupoId,
            ura_id: cliente.ura_id,
            remetente_id: cliente.remetente_id,
            datahora_inicio: data,
            datahora_fila: data,
            tipo: 'WEB',
            cpf: cliente.cpf
        };
        yield atendimento_model_1.addAtendimento(atendimento);
        yield exports.iniciaAtendimentoWEB(atendimento, socket);
    }
    else {
        atendimento.chave = socket.id;
        atendimento.grupo_id = grupoId;
        yield exports.updateChaveAtendimento(atendimento);
        socket.emit('atendEmCurso', atendimento);
        yield exports.carregaMensagensAtendimento(atendimento);
        logs_1.Log('Atendimento "' + atendimento.id + '" continuado...' + '\n    File Info ( ' + logs_1.GetFileCode() + ' )');
    }
});
exports.updateChaveAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    yield conexao_1.database.query("update tb_atendimento set cliente_chave = '" + atendimento.chave + "', grupo_id = '" + atendimento.grupo_id + "' where id = " + atendimento.id);
});
exports.iniciaAtendimentoWEB = (atendimento, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
    yield exports.checkCliente(atendimento);
    let data = new Date();
    atendimento.preAtendimento = true;
    let sProtocolo = yield conexao_1.database.query("CALL sp_getprotocolo('" + atendimento.numero + "');");
    atendimento.protocolo = sProtocolo[0][0][0].protocolo;
    // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
    //     checkNumero(data.getDate()).toString() + atendimento.cpf.substring(0, 4) + checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
    //     + checkNumero(data.getSeconds()).toString();
    // criar um metodo pra fazer o trabalho da ura;
    yield exports.iniciaAtendimento(atendimento);
    socket.emit('clienteLoginResp', {
        success: true,
        retorno: atendimento,
        mensagens: [
            // {
            //     msg: remetente.config.msg_boot_nivel2_pergunta,
            //     tipo: 'AGENTE',
            //     data: new Date()
            // },
            {
                msg: 'O número de protocolo do seu atendimento é: ' + atendimento.protocolo,
                tipo: 'AGENTE',
                data: new Date()
            }
        ]
    });
    atendimento.nivel = 3;
    yield exports.checkAgenteDisponivel(atendimento);
});
exports.carregaMensagensAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let dadosMensagens = yield conexao_1.database.query("select * from tb_mensagem where atendimento_id = " + atendimento.id);
    if (!dadosMensagens[0])
        return;
    for (let index = 0; index < dadosMensagens[0].length; index++) {
        const mensagem = dadosMensagens[0][index];
        io_1.io.emit('msgReceived', {
            id: atendimento.chave,
            msg: mensagem.mensagem.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&apos;/g, "\\'").replace(/<br>/g, '\n'),
            tipo: mensagem.origem,
            data: new Date(mensagem.datahora_envio)
        });
    }
});
//# sourceMappingURL=atendimento-controller.js.map