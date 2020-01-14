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
const funcs_1 = require("./../globais/funcs");
const conexao_1 = require("./conexao");
const logs_1 = require("./../globais/logs");
const agente_controller_1 = require("./../controllers/agente-controller");
const agente_model_1 = require("./../models/agente-model");
exports.setRoutes = function (app) {
    app.post('/postMensagem', function (req, res) {
        postMensagem(req.body)
            .then(() => {
            res.send({
                success: true
            });
        })
            .catch(error => {
            logs_1.LogErro('Erro ao salvar mensagem offline!', error);
            res.send({
                success: false,
                erro: error.toString()
            });
        });
    });
    // rota de deslogar agente front end
    app.post('/logout-agente', (req, res) => __awaiter(this, void 0, void 0, function* () {
        console.log('rota de login');
        console.log('req body: ', req.body);
        let agente = yield agente_model_1.getAgenteById(req.body.usuario_id);
        console.log(agente);
        if (agente) {
            yield agente_controller_1.desconectar(agente.socket, req.body.usuario_id);
            res.json({ result: true });
        }
        else {
            res.json({ result: false });
        }
    }));
    // rota de login de agente mobile
    app.post('/login', (req, res) => __awaiter(this, void 0, void 0, function* () {
        console.log(req.body);
        let chave = 'SOMASAC_MOBILE1A2B3C4D5E6F7G8H9I10JWELLITEL_6105';
        if (chave === req.body.chave) {
            // continue o resto
            let usuario = req.body.usuario;
            let senha = req.body.senha;
            let dadosUsuer = yield conexao_1.database.query("select * from tb_usuario where usuario = '" + usuario + "' and senha = '" + senha + "'");
            if (dadosUsuer[0][0]) {
                // tenho um usuario
                if (dadosUsuer[0][0].nivel === 'AGENTE') {
                    if (dadosUsuer[0][0].permitir_app_mobile == 'True') {
                        // tem permissao
                        res.json({ result: 'success', usuario: dadosUsuer[0][0], msg: 'Login realizado com sucesso' });
                    }
                    else {
                        // deu error com força
                        res.json({ result: 'error', usuario: [], msg: 'Error nao tem a perissao de acesso' });
                    }
                }
                else {
                    //nao tem permissao
                    res.json({ result: 'error', usuario: [], msg: 'Error nao tem a perissao de acesso' });
                }
            }
            else {
                // deu error com força
                res.json({ result: 'error', usuario: [], msg: 'Error nao existe usuario, ou tem error no usuario ou senha' });
            }
        }
        else {
            // deu error com força
            res.json({ result: 'error', usuario: [], msg: 'Error nao tem a chave de perissao' });
        }
    }));
    // rota de conversas agente mobile
    app.get('/conversas', (req, res) => {
        //
    });
};
const postMensagem = (parametros) => __awaiter(void 0, void 0, void 0, function* () {
    let data = new Date();
    let dhInicio = new Date(parametros.cliente.data_inicio);
    let protocolo = data.getFullYear().toString() + funcs_1.checkNumero(data.getMonth() + 1).toString() +
        funcs_1.checkNumero(data.getDate()).toString() + (parametros.cliente.cpf) ? parametros.cliente.cpf.substring(0, 4) : 36912
        + funcs_1.checkNumero(data.getHours()).toString() + funcs_1.checkNumero(data.getMinutes()).toString() +
        +funcs_1.checkNumero(data.getSeconds()).toString();
    let dt = data.getFullYear().toString() + '-' + funcs_1.checkNumero(data.getMonth() + 1).toString() + '-' +
        funcs_1.checkNumero(data.getDate()).toString() + ' ' + funcs_1.checkNumero(data.getHours()).toString() + ':' +
        funcs_1.checkNumero(data.getMinutes()).toString() + ':' + funcs_1.checkNumero(data.getSeconds()).toString();
    let dtInicio = dhInicio.getFullYear().toString() + '-' + funcs_1.checkNumero(dhInicio.getMonth() + 1).toString() + '-' +
        funcs_1.checkNumero(dhInicio.getDate()).toString() + ' ' + funcs_1.checkNumero(dhInicio.getHours()).toString() + ':' +
        funcs_1.checkNumero(dhInicio.getMinutes()).toString() + ':' + funcs_1.checkNumero(dhInicio.getSeconds()).toString();
    let idCliente = 0;
    let dadoCliente = yield conexao_1.database.query("select * from tb_cliente where cpf = '" + parametros.cliente.cpf + "' and empresa_id = " + parametros.cliente.empresa_id);
    if (dadoCliente[0][0]) {
        idCliente = dadoCliente[0][0].id;
        yield conexao_1.database.query("update tb_cliente set telefone = " +
            (parametros.cliente.telefone ? '\'' + parametros.cliente.telefone + '\'' : 'telefone') +
            ", email = " + (parametros.cliente.email ? '\'' + parametros.cliente.email + '\'' : 'email') +
            " where id = " + idCliente);
        yield gravaAtendimento({
            protocolo: protocolo,
            dtInicio: dtInicio,
            dtAtual: dt,
            grupo_id: parametros.cliente.grupo_id,
            empresa_id: parametros.cliente.empresa_id,
            cliente_id: idCliente,
            mensagem: parametros.mensagem
        });
    }
    else {
        yield conexao_1.database.query("INSERT  INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar,email) values ('" +
            parametros.cliente.nome + "','" + parametros.cliente.cpf + "', '" + parametros.cliente.telefone + "', " + parametros.cliente.empresa_id +
            ",'','','" + parametros.cliente.email + "')");
        let dadoCliente = yield conexao_1.database.query("select * from tb_cliente where cpf = '" + parametros.cliente.cpf + "' and empresa_id = " + parametros.cliente.empresa_id);
        idCliente = dadoCliente[0][0].id;
        yield gravaAtendimento({
            protocolo: protocolo,
            dtInicio: dtInicio,
            dtAtual: dt,
            grupo_id: parametros.cliente.grupo_id,
            empresa_id: parametros.cliente.empresa_id,
            cliente_id: idCliente,
            mensagem: parametros.mensagem
        });
    }
});
const gravaAtendimento = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    yield conexao_1.database.query("insert into tb_atendimento (protocolo, datahora_inicio, datahora_fila, datahora_fim, grupo_id, empresa_id, tipo, cliente_id, cliente_finalizou) values ('" +
        atendimento.protocolo + "', '" + atendimento.dtInicio + "', '" + atendimento.dtInicio + "', '" + atendimento.dtAtual + "', " + atendimento.grupo_id + ", " + atendimento.empresa_id +
        ", 'OFFLINE', " + atendimento.cliente_id + ", 'False');");
    let dadoAtendimento = yield conexao_1.database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo + "'");
    let idAtendimento = dadoAtendimento[0][0].id;
    yield conexao_1.database.query("insert into tb_mensagem (atendimento_id,origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id) values " +
        "(" + idAtendimento + ", 'CLIENTE', " + atendimento.cliente_id + ", '" + atendimento.dtAtual + "', 'ASSUNTO: " + atendimento.mensagem.assunto + " <br> MENSAGEM: " + atendimento.mensagem.msg +
        "', " + atendimento.empresa_id + ", '" + 'CI_' + atendimento.cliente_id + '_' + atendimento.dtAtual + "', '" + 'CI_' + atendimento.cliente_id + '_' + atendimento.dtAtual + "')");
});
//# sourceMappingURL=routers.js.map