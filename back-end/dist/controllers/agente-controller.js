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
const dataTempo = require("node-datetime");
const agente_model_1 = require("./../models/agente-model");
const conexao_1 = require("./../libs/conexao");
const atendimento_controller_1 = require("./atendimento-controller");
const remetente_model_1 = require("./../models/remetente-model");
const atendimento_model_1 = require("./../models/atendimento-model");
const mensagem_service_1 = require("./mensagem-service");
const io_1 = require("./../libs/io");
const grupo_models_1 = require("./../models/grupo-models");
const dbconn_1 = require("../globais/dbconn");
exports.dbLogin = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    let sQtdAtendimentos = 0;
    yield dbconn_1.execSQL("update tb_agente_login set datahora_logout=NOW() where usuario_id = " + agente.id + "  and datahora_logout is null;");
    yield dbconn_1.execSQL("insert into tb_agente_login (usuario_id, datahora_login,grupos_id) values (" + agente.id + ", '" + data + "', " +
        "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
        " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'));");
    let sAtt = yield atendimento_model_1.getAtendimentosByAgenteId(agente.id);
    if (sAtt) {
        sQtdAtendimentos = sAtt.length;
    }
    agente.qtdAtendimentos = sQtdAtendimentos;
    let listGrupos = yield conexao_1.database.query("SELECT tga.grupo_id, tga.agente_id, tg.nome, tg.supervisor_id, tg.empresa_id FROM " +
        " tb_grupo_agente AS tga INNER JOIN tb_grupo as tg where tg.id = tga.grupo_id AND tga.agente_id = " + agente.id);
    for (let index = 0; index < listGrupos[0].length; index++) {
        const grupoBD = listGrupos[0][index];
        let grupo = {
            id: grupoBD.grupo_id,
            nome: grupoBD.nome,
            agente_id: grupoBD.agente_id,
            empresa_id: grupoBD.empresa_id,
            supervisor_id: grupoBD.supervisor_id
        };
        yield grupo_models_1.addGrupo(grupo);
    }
});
exports.dbLogoff = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("update tb_agente_login set datahora_logout = '" + data + "' where usuario_id = " + agente.id +
        " and datahora_logout is null");
});
exports.dbFinalizaPausa = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("update tb_agente_pausa set datahora_fim = now() where usuario_id = " + agente.id +
        " and datahora_fim is null");
});
exports.agentePausa = (agente, tipo, temProgramado) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    if (temProgramado) {
        yield conexao_1.database.query("update tb_agente_pausa set datahora_inicio= '" + data + "' where id = " + agente.pausaId);
        agente.pausa_programada = false;
    }
    else {
        yield conexao_1.database.query("insert into tb_agente_pausa (usuario_id, datahora_inicio, datahora_programado, tipo, grupos_id) values (" +
            agente.id + ", '" + data + "', '" + data + "', '" + tipo + "', " +
            "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
            " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'))");
        let dadoPausa = yield conexao_1.database.query("select * from tb_agente_pausa where usuario_id = " + agente.id +
            " and datahora_fim is null order by id desc limit 1");
        agente.pausaId = dadoPausa[0][0].id;
        agente.pausa_programada = false;
    }
});
exports.agentePausaProgramada = (agente, tipo) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("insert into tb_agente_pausa (usuario_id, datahora_programado, tipo, grupos_id) values (" +
        agente.id + ", '" + data + "', '" + tipo + "', " +
        "(select GROUP_CONCAT(g.id SEPARATOR ',') grupos  from tb_grupo g, tb_grupo_agente ga where" +
        " g.id = ga.grupo_id and ga.agente_id = " + agente.id + " AND g.ativo = 'True'))");
    let dadoPausa = yield conexao_1.database.query("select * from tb_agente_pausa where usuario_id = " + agente.id +
        " and datahora_fim is null order by id desc limit 1");
    agente.pausaId = dadoPausa[0][0].id;
    agente.pausa_programada = true;
});
exports.desconectar = (socket_id, agente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let agente;
    if (agente_id != null) {
        agente = yield agente_model_1.getAgenteById(agente_id);
    }
    else {
        agente = yield agente_model_1.getAgenteBySocket(socket_id);
    }
    if (agente) {
        yield exports.dbFinalizaPausa(agente);
        yield atendimento_controller_1.removeAgenteAtendimento(agente);
        yield exports.dbLogoff(agente);
        yield agente_model_1.delAgente(agente);
        if (agente_id != null)
            io_1.io.emit('deslogandoUsuario', agente.id);
        return;
    }
    let atendimento = yield atendimento_model_1.getAtendimentoByChave(socket_id);
    if (atendimento) {
        atendimento_controller_1.finalizaAtendimento(atendimento, false);
    }
});
exports.removeAgenteSocket = (socket_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Removendo agente por desconexao do socket');
    let agente = yield agente_model_1.getAgenteBySocket(socket_id);
    if (!agente)
        return;
    agente.socket = null;
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        let agenteVerifica = yield agente_model_1.getAgenteById(agente.id);
        if (!agenteVerifica)
            return;
        if (agenteVerifica.socket == null) {
            console.log('tem que deslogar o agente por nao ter socket');
            yield atendimento_controller_1.removeAgenteAtendimento(agente);
            yield exports.dbLogoff(agente);
            yield agente_model_1.delAgente(agente);
        }
    }), 180000);
});
exports.agenteLogin = (login) => __awaiter(void 0, void 0, void 0, function* () {
    let sAgente = yield agente_model_1.getAgenteById(login.usuario_id);
    if (sAgente) {
        agente_model_1.delAgente(sAgente);
    }
    let agente = {
        id: login.usuario_id,
        nome: login.nome,
        empresa_id: login.empresa_id,
        grupo_id: login.grupo_id,
        grupo_nome: login.grupo_nome,
        pausa: false,
        pausaId: 0,
        pausa_programada: false,
        pausa_tipo: '',
        qtdAtendimentos: 0,
        qtdEmAtendimento: 0,
        socket: login.socket_id
    };
    yield dbconn_1.execSQL("update tb_usuario set qtd_atendimentos='0' where id=" + agente.id);
    yield agente_model_1.addAgente(agente);
    yield exports.dbLogin(agente);
    return agente;
});
exports.cancelarPausa = (usuario) => __awaiter(void 0, void 0, void 0, function* () {
    let agente = yield agente_model_1.getAgenteById(usuario.usuario_id);
    if (agente) {
        agente.pausa_programada = false;
        agente.pausa_tipo = '';
        agente.pausa = null;
        yield exports.dbFinalizaPausa(agente);
        yield atendimento_controller_1.checkAtendimentos(agente, false);
    }
});
exports.programarPausa = (usuario) => __awaiter(void 0, void 0, void 0, function* () {
    let agente = yield agente_model_1.getAgenteById(usuario.usuario_id);
    if (agente) {
        agente.pausa_programada = true;
        agente.pausa_tipo = usuario.tipo;
        if (agente.qtdEmAtendimento == 0) {
            yield exports.agentePausa(agente, usuario.tipo, false);
        }
        else {
            yield exports.agentePausaProgramada(agente, usuario.tipo);
        }
        return agente.pausaId;
    }
});
exports.userSendMsg = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("FUNCTION: userSendMsg: ##############################");
    // console.log(msg);
    let agente = yield agente_model_1.getAgenteById(msg.origem_id);
    let remetente = yield remetente_model_1.getRemetenteById(msg.remetente_id);
    let atendimento = yield atendimento_model_1.getAtendimentoById(msg.atendimento_id);
    // console.log('atm idid: ',atendimento);
    if (remetente && atendimento) { //&& agente) {
        console.log('enviando mensagem');
        // if (remetente && (remetente.autenticado || remetente.tipo == RemetenteTipo.WEB) && atendimento) { //&& agente) {
        // if (remetente && (remetente.autenticado || remetente.tipo == RemetenteTipo.WEB) && atendimento && agente) {
        //novos campos: base64file file_name type_file exists_image exists_document
        yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msg.msg, msg.msg_id, msg.origem_id, msg.envio_datahora, msg.base64file, msg.file_name, msg.type_file, msg.exists_image, msg.exists_document, msg.tipo, 'null');
    }
    else {
        throw new Error('Não foi possível enviar a mensagem. Tente novamente!');
    }
});
exports.getQtdAtendimentos = (agente) => __awaiter(void 0, void 0, void 0, function* () {
    let atendimentos = yield atendimento_model_1.getAtendimentosByAgenteId(agente.id);
    agente.qtdEmAtendimento = atendimentos.length;
});
//# sourceMappingURL=agente-controller.js.map