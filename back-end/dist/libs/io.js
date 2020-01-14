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
const express = require("express");
exports.app = express();
const configs_1 = require("./../globais/configs");
const logs_1 = require("./../globais/logs");
const fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');
const dbconn_1 = require("../globais/dbconn");
//app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
exports.app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
exports.app.use(bodyParser.json());
//set port
exports.app.set("port", configs_1.SocketConfig.socket_porta);
//cors credentials
exports.app.use(cors({ credentials: true }));
const routers_1 = require("./routers");
routers_1.setRoutes(exports.app);
//routers api integration
const route_api_company_integration_1 = require("./../integration-company-api/route-api-company-integration");
route_api_company_integration_1.default(exports.app);
//routes api whatssap
// import { routesApiWhatssap } from './../whatsappApi/routes-api-whatssap';
// routesApiWhatssap(app);
//routers facebook
// routers-facebook
// import { routersFacebook } from './../facebook/routers-facebook';
// routersFacebook(app);
var https = require('http').Server(exports.app);
if (configs_1.SocketConfig.ssl) {
    const privateKey = fs.readFileSync(configs_1.SocketConfig.privateKey, 'utf8');
    const certificate = fs.readFileSync(configs_1.SocketConfig.certificate, 'utf8');
    const ca = fs.readFileSync(configs_1.SocketConfig.ca, 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };
    https = require('https').Server(credentials, exports.app);
}
exports.io = require('socket.io')(https);
const dataTempo = require("node-datetime");
const agente_controller_1 = require("./../controllers/agente-controller");
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
const remetente_controller_1 = require("./../controllers/remetente-controller");
const inicializacao_1 = require("./../inicializacao");
const remetente_model_1 = require("./../models/remetente-model");
const atendimento_model_1 = require("./../models/atendimento-model");
const mensagem_service_1 = require("./../controllers/mensagem-service");
const agente_model_1 = require("./../models/agente-model");
const transferenciaAtendimento_1 = require("./../whatsapp/transferenciaAtendimento");
const intervencaoSupervisor_1 = require("./../whatsapp/intervencaoSupervisor");
const atendimentos_pendentes_1 = require("./../whatsapp/atendimentos-pendentes");
const web_controller_1 = require("./../controllers/web-controller");
const inicia_atendimento_1 = require("./../whatsapp/iniciar-atendimento/inicia-atendimento");
const horario_funcionamento_controller_1 = require("./../controllers/horario-funcionamento-controller");
const conexao_1 = require("./conexao");
const charts_model_1 = require("../models/charts-model");
const atendimento_model_2 = require("../models/atendimento-model");
exports.io.on('connection', function (socket) {
    console.log('Nova conexão: ' + socket.id);
    socket.emit('connection_success');
    //Eventos agente
    socket.on('userLogin', usuario => {
        console.log('### Login do Usuário: ' + usuario.nome);
        usuario.socket_id = socket.id;
        agente_controller_1.agenteLogin(usuario)
            .then((agente) => {
            atendimento_controller_1.checkAtendimentos(agente, true)
                .then(() => {
                logs_1.Log('Agente: ' + agente.id + ' logou!');
                socket.emit('userLoginResp');
            })
                .catch(error => {
                logs_1.LogErro('Erro no Login do agente', error);
                socket.emit('userLoginError', error.stack);
            });
        })
            .catch((error) => {
            logs_1.LogErro('Erro no Login do agente', error);
            socket.emit('userLoginError', error.stack);
        });
    });
    socket.on('cancelarPausaProgramada', usuario => {
        (() => __awaiter(this, void 0, void 0, function* () {
            agente_controller_1.cancelarPausa(usuario)
                .then(() => {
                socket.emit('cancelarPausaProgramadaResp', JSON.stringify({ success: true }));
            })
                .catch(error => {
                socket.emit('cancelarPausaProgramadaResp', JSON.stringify({ success: false }));
            });
        }))();
    });
    socket.on('finalizaPausa', usuario => {
        agente_controller_1.cancelarPausa(usuario)
            .then(() => {
            socket.emit('finalizaPausaResp', JSON.stringify({ success: true }));
        })
            .catch(error => {
            socket.emit('finalizaPausaResp', JSON.stringify({ success: false }));
        });
    });
    socket.on('programaPausa', pausa => {
        agente_controller_1.programarPausa(pausa)
            .then((pausaId) => {
            socket.emit('userPaused', JSON.stringify({ usuario_id: pausa.usuario_id, success: true, pausa_id: pausaId }));
        })
            .catch(error => {
            socket.emit('userPaused', JSON.stringify({ usuario_id: pausa.usuario_id, success: false, erro: error.toString() }));
        });
    });
    socket.on('userSendMsg', msg => {
        // console.log('verificar msg new campos: ',msg);    
        agente_controller_1.userSendMsg(msg)
            .catch(error => {
            logs_1.LogErro('Não foi possível enviar a mensagem. Tente novamente!', error);
            socket.emit('userSendMsgResponse', 'Não foi possível enviar a mensagem. Tente novamente!', msg.msg_id);
        });
    });
    socket.on('getMensagens', (cliente_id, tronco_id, protocolo) => {
        atendimento_controller_1.getMensagens(cliente_id, tronco_id, protocolo)
            .then(mensagens => {
            console.log("Recebido getMensagens: cliente_id:" + cliente_id + " tronco_id: " + tronco_id + " protocolo: " + protocolo);
            socket.emit('getMensagensResp', 1, JSON.stringify(mensagens), cliente_id);
        })
            .catch(error => {
            socket.emit('getMensagensResp', 0, error.toString(), cliente_id);
        });
    });
    // RESP MOBILE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    socket.on('getMensagensMobile', (cliente_id, tronco_id, protocolo) => {
        atendimento_controller_1.getMensagens(cliente_id, tronco_id, protocolo)
            .then(mensagens => {
            console.log("Recebido getMensagensMobile: cliente_id:" + cliente_id + " tronco_id: " + tronco_id + " protocolo: " + protocolo);
            socket.emit('getMensagensRespMobile', [1, JSON.stringify(mensagens), cliente_id]);
        })
            .catch(error => {
            socket.emit('getMensagensRespMobile', 0, error.toString(), cliente_id);
        });
    });
    // FIM RESP MOBILE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    socket.on('onClose', () => {
        agente_controller_1.removeAgenteSocket(socket.id);
    });
    socket.on('disconnect', () => {
        agente_controller_1.removeAgenteSocket(socket.id);
    });
    socket.on('deslogaUsuario', (agente_id) => {
        console.log('deslogando usuario com id ', agente_id);
        agente_controller_1.desconectar(socket.id, agente_id);
    });
    socket.on('reinicializar', (empresa_id) => {
        remetente_controller_1.reinicializar(empresa_id);
    });
    socket.on('empConfig', empresa_id => {
        remetente_controller_1.updateConfig(empresa_id);
    });
    socket.on('openBrowser', operacao => {
        inicializacao_1.default(operacao.id);
    });
    socket.on('desativar', operacao => {
        // console.log('lista de operacao: ' + operacao.id + 'remetent - empresa ' + operacao.empresa_id)
        remetente_controller_1.desativar(operacao.id)
            .then(() => {
            socket.emit('desativarResponse', JSON.stringify({ success: true, remetente_id: operacao.id }));
        })
            .catch(error => {
            socket.emit('desativarResponse', JSON.stringify({ success: false, remetente_id: operacao.id, erro: error.toString() }));
        });
    });
    socket.on('updateGrupo', empresa_id => {
        remetente_controller_1.reinicializar(empresa_id);
    });
    socket.on('getAtendimentosSemana', (parametro) => {
        //getAtendimentosSemana(parametro.empresa_id)
        charts_model_1.getWeekChartSerie(parametro.empresa_id)
            .then(atendimentos => {
            console.log(JSON.stringify(atendimentos));
            if (atendimentos)
                exports.io.emit('getAtendimentosSemanaResp', parametro.empresa_id, atendimentos);
        })
            .catch(error => {
            logs_1.LogErro('Erro ao pega atendimentos da semana', error);
        });
    });
    socket.on('finalizaAtedimento', pAtendimento => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let dt = dataTempo.create();
            let data = dt.format('Y-m-d H:M:S');
            let atendimento = yield atendimento_model_1.getAtendimentoById(pAtendimento.id);
            if (!atendimento) {
                let idAgent;
                let supervisorid;
                if (atendimento.agente_id) {
                    if (atendimento.agente_id == pAtendimento.agente_id) {
                        idAgent = pAtendimento.agente_id;
                        supervisorid = 0;
                    }
                    else {
                        supervisorid = pAtendimento.agente_id;
                        idAgent = atendimento.agente_id;
                    }
                }
                else {
                    idAgent = pAtendimento.agente_id;
                }
                let agente = yield agente_model_1.getAgenteById(idAgent);
                agente.qtdEmAtendimento = (agente.qtdEmAtendimento > 0 ? agente.qtdEmAtendimento - 1 : 0);
                yield conexao_1.database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + agente.id);
                exports.io.emit('atendimentoFinalizado', JSON.stringify({
                    usuario_id: idAgent,
                    supervisor_id: supervisorid,
                    protocolo: pAtendimento.protocolo
                }));
                yield atendimento_controller_1.checkAtendimentos(agente, false);
                return;
            }
            else {
                if (!atendimento.datahora_fila) {
                    atendimento.datahora_fila = data;
                }
                if (!atendimento.datahora_atendimento) {
                    atendimento.datahora_atendimento = data;
                }
            }
            if (atendimento.intervencao_supervisor_id == pAtendimento.agente_id) {
                yield intervencaoSupervisor_1.encerrarIntervencaoSupervisor(atendimento.id, socket);
            }
            let remetente = yield remetente_model_1.getRemetenteById(atendimento.remetente_id);
            yield atendimento_controller_1.finalizaAtendimento(atendimento, false);
            if (atendimento.tipo == 'WHATSAPP') {
                if (atendimento.chave == 'ChaveFalse') {
                    yield remetente.page.evaluate('sendMessageToNumber("' + atendimento.numero + '","' + remetente.config.msg_forcar_finalizar_atendimento + '");');
                }
                else {
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_forcar_finalizar_atendimento + '");');
                }
            }
            else {
                exports.io.emit('attendTerminate', {
                    id: atendimento.chave,
                    mensagem: remetente.config.msg_forcar_finalizar_atendimento
                });
            }
            logs_1.Log('Atendimento: ' + atendimento.id + ' finalizado');
            exports.io.emit('atendimentoFinalizado', JSON.stringify({
                usuario_id: atendimento.agente_id,
                protocolo: atendimento.protocolo,
                supervisor_id: (atendimento.intervencao_supervisor_id == pAtendimento.agente_id ? atendimento.intervencao_supervisor_id : '0')
            }));
        }))();
    });
    socket.on('clienteDesistiu', atendimento => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let atend = yield atendimento_model_1.getAtendimentoById(atendimento.id);
            atendimento_controller_1.finalizaAtendimento(atend, false);
        }))();
    });
    socket.on('checkContatos', campanha_id => {
        remetente_controller_1.checkContatos(campanha_id);
    });
    // ###SYSTEM ## FOR ## WEB###
    socket.on('cadastroWebAtendimentoNaoInicado', dadosCliente => {
        // cadastrar os dados do cliente
        web_controller_1.webAtendimentoNaoInicado(dadosCliente);
    });
    socket.on('verificaUraWeb', (tronco_id, empresa_id) => {
        web_controller_1.verificaUraWeb(tronco_id, empresa_id);
    });
    socket.on('reqListUra', (empresa_id, cpf_cliente) => {
        //create the method to list of ura
        // console.log('empresa id req ura: ' + empresa_id);
        web_controller_1.retornoListaUraWeb(empresa_id, cpf_cliente);
    });
    socket.on('reqLigarClienteChatWeb', (cliente, config) => {
        console.log('cliente: ', cliente);
        console.log('config: ', config);
        web_controller_1.ligarClienteChatWeb(cliente, config);
    });
    socket.on('reqIniciarWhatsAppChatWeb', (cliente, tronco_id) => {
        console.log('cliente: ', cliente);
        console.log('config: ', tronco_id);
        web_controller_1.iniciarWhatsAppChatWeb(cliente, tronco_id);
    });
    // ###SYSTEM ## FOR ## WEB###
    // ###SYSTEM ## FROM ## MOBILE###
    socket.on('testeMobile', (teste) => {
        console.log('chegou o teste mobile');
        console.log(teste);
        socket.emit('RetornoTeste', JSON.stringify({ usuario_id: '39' }));
    });
    // ###SYSTEM ## FROM ## MOBILE###
    socket.on('clienteLogin', cliente => {
        atendimento_controller_1.clienteLogin(cliente, socket)
            .catch(error => {
            socket.emit('clienteLoginResp', {
                success: false,
                cause: 'ERRO',
                erro: error.toString()
            });
        });
    });
    socket.on('msgSend', (message, atend) => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let remetente = yield remetente_model_1.getRemetenteById(atend.remetente_id);
            let atendimento = yield atendimento_model_1.getAtendimentoById(atend.id);
            let dt = dataTempo.create();
            let data = dt.format('Y-m-d H:M:S');
            // method finalizar pelo cliente
            // await finalizarAtmClientWeb(atendimento.id, message.msg);
            mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', message.msg, 'CI_' + atendimento.cliente.id + data, 0, data, '', '', '', 'False', 'False', 'texto', 'null');
        }))();
    });
    socket.on('transferirGrupoFila', (atendimento_id, agente_transferencia_id, grupo_id, remetente_id) => {
        // chamar a classe de transferencia
        console.log('transferencia: ', atendimento_id, agente_transferencia_id, grupo_id, remetente_id);
        transferenciaAtendimento_1.transferenciaAtendimento(atendimento_id, agente_transferencia_id, grupo_id, remetente_id, socket);
    });
    socket.on('atendimentoIntervencaoSupervisor', (atendimento_id) => {
        console.log('antendimento_id intervencao: ' + atendimento_id);
        // chamar intervenção do supervisor
        intervencaoSupervisor_1.intervencaoSupervisor(atendimento_id, socket);
    });
    socket.on('updateRemetenteId', (remetente_id) => {
        //update of the table remetent(tronco)
        (() => __awaiter(this, void 0, void 0, function* () {
            console.log('atualizou o agente');
            remetente_controller_1.updateRemetenteId(remetente_id);
        }))();
    });
    socket.on('updateIntervencao', (atendimento_id) => {
        intervencaoSupervisor_1.updateIntervencaoSupervisor(atendimento_id);
    });
    socket.on('encerrarIntervencao', (atendimento_id) => {
        // (async () => {
        //   await encerrarIntervencaoSupervisor(atendimento_id,socket);
        //   socket.emit('encerrarIntervencaoResp', atendimento_id);
        // });
        intervencaoSupervisor_1.encerrarIntervencaoSupervisor(atendimento_id, socket);
    });
    socket.on('liberarAtendimentoPendente', (atendimento_id) => {
        console.log('liberarAtendimentoPendente ', atendimento_id);
        atendimentos_pendentes_1.liberarAtedimentoPendente(atendimento_id);
    });
    socket.on('finalizarAtendimentoPendente', (atendimento_id) => {
        console.log('finalizarAtendimentoPendente ', atendimento_id);
        atendimentos_pendentes_1.finalizarAtendimentoPendente(atendimento_id);
    });
    socket.on('logout', troncoIdEmpresaId => {
        console.log('troncoEmpresaId: ', troncoIdEmpresaId);
        (() => __awaiter(this, void 0, void 0, function* () {
            let tronco = yield remetente_model_1.getRemetenteById(troncoIdEmpresaId.id);
            // console.log(tronco);
            // if (tronco.tipo == RemetenteTipo.WHATSAPP) {
            //   tronco.page.evaluate('logout();');
            // }
        }))();
    });
    socket.on("updateQrCode", (tronco_id) => {
        // console.log('update qrCode: ',tronco_id);
        (() => __awaiter(this, void 0, void 0, function* () {
            let tronco = yield remetente_model_1.getRemetenteById(tronco_id);
            // await inicializacao(tronco_id);
            if (tronco.page) {
                tronco.page.close();
            }
            if (tronco.browser) {
                tronco.browser.close();
            }
            console.log('### updateQrCode');
            remetente_controller_1.getBrowser(tronco);
            // reinicializar(tronco.empresa_id);
        }))();
    });
    // socket.on("listAtendimentoFinalizados", (agente_id, empresa_id) => {
    //   //criar uma classe para tratar os atm finalizados
    //   listAtendimentosFinalizados(agente_id, empresa_id);
    // });
    socket.on("beginNewAtendimento", (iniciaNewAtm) => {
        console.log('destinoNovoAtm: ', iniciaNewAtm.destino);
        inicia_atendimento_1.iniciaNewAtendimento(iniciaNewAtm.destino, iniciaNewAtm.tronco_id, iniciaNewAtm.mensagem, iniciaNewAtm.agente_id);
    });
    socket.on("listClientesIniciar", agente_id => {
        console.log('list cliente id ', agente_id);
        //criar um service para list of client
    });
    socket.on("insertHorariosFuncinamento", horariosFunc => {
        console.log('horariosFunc: ', horariosFunc);
        horario_funcionamento_controller_1.insertHorarioFuncionamentoController(horariosFunc);
    });
    socket.on("updateHorariosFuncionamento", horariosFunc => {
        console.log('horariosFunc: ', horariosFunc);
        horario_funcionamento_controller_1.updateHorarioFuncionamentoController(horariosFunc);
    });
    socket.on("GetAllAtt", (empresa_id) => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let sText = '\n';
            sText += '________________________________________________\n';
            sText += '### EMPRESA ID - ATENDIMENTOS ###\n';
            sText += empresa_id + '\n';
            sText += '________________________________________________\n';
            logs_1.Log(sText);
            let atendientos = yield atendimento_model_1.getAtendimentosByEmpresaId(empresa_id);
            for (let index = 0; index < atendientos.length; index++) {
                const atendimento = atendientos[index];
                console.log('________________________________________________');
                console.log('### INFORMAÇÕES DO ATENDIMENTO ###');
                console.log(atendimento);
                console.log('________________________________________________');
            }
            sText = '\n';
            sText += '________________________________________________\n';
            sText += '### INFORMAÇÕES DOS ATENDIMENTOS ###\n';
            sText += JSON.stringify(atendientos) + '\n';
            sText += '________________________________________________\n';
            logs_1.Log(sText);
            socket.emit('ResAllAtt', atendientos);
        }))();
    });
    socket.on("GetAllUsers", (empresa_id) => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let sText = '\n';
            sText += '________________________________________________\n';
            sText += '### EMPRESA ID - USUÁRIOS ###\n';
            sText += empresa_id + '\n';
            sText += '________________________________________________\n';
            logs_1.Log(sText);
            let agentes = yield agente_model_1.getAgentesByEmpresaId(empresa_id);
            for (let index = 0; index < agentes.length; index++) {
                const agente = agentes[index];
                console.log('________________________________________________');
                console.log('### INFORMAÇÕES DO AGENTE ###');
                console.log(agente);
                console.log('________________________________________________');
            }
            sText = '\n';
            sText += '________________________________________________\n';
            sText += '### INFORMAÇÕES DOS AGENTES ###\n';
            sText += JSON.stringify(agentes) + '\n';
            sText += '________________________________________________\n';
            logs_1.Log(sText);
            socket.emit('ResAllUsers', agentes);
        }))();
    });
    socket.on("SetAttToUser", (atendimento_id, agente_id) => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let dt = dataTempo.create();
            let data = dt.format('Y-m-d H:M:S');
            let sText = '\n';
            sText += '________________________________________________\n';
            sText += '### ENVIO DE ATENDIMENTO MANUAL ###\n';
            sText += 'Atendimento: ' + atendimento_id + ' - Agente: ' + agente_id + '\n';
            const atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
            const agente = yield agente_model_1.getAgenteById(agente_id);
            if (atendimento && agente) {
                atendimento.retirar_pendente = true;
                atendimento.grupo_id = agente.grupo_id;
                if (!atendimento.datahora_fila) {
                    atendimento.datahora_fila = data;
                }
                yield atendimento_controller_1.setAgenteAtendimento(agente, atendimento);
                sText += 'Concluido com exito!\n';
            }
            else {
                sText += 'Falha no envio!\n';
            }
            sText += '________________________________________________\n';
            logs_1.Log(sText);
        }))();
    });
    socket.on("DelAttToArray", (atendimento_id) => {
        (() => __awaiter(this, void 0, void 0, function* () {
            let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
            if (atendimento) {
                yield atendimento_model_2.delAtendimento(atendimento);
            }
        }))();
    });
    socket.on("getStatusTruck", (tronco_id) => {
        console.log('### (Socket): getStatusTruck: ', tronco_id);
        (() => __awaiter(this, void 0, void 0, function* () {
            let teste = yield dbconn_1.execSQL('select * from tb_usuario');
            console.log('___________________________________');
            for (let index = 0; index < teste.length; index++) {
                const sLine = teste[index];
                if (sLine.nome != '') {
                    console.log(sLine.nome);
                }
            }
            console.log('___________________________________');
        }))();
    });
});
https.listen(configs_1.SocketConfig.socket_porta, function () {
    logs_1.Log('Servidor iniciado na porta: ' + configs_1.SocketConfig.socket_porta);
});
// https.listen(8582, function () {
//   Log('Servidor iniciado na porta: 8582');
// });
//# sourceMappingURL=io.js.map