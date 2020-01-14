import * as express from "express";
export const app = express();
import { SocketConfig } from './../globais/configs';
import { Log, LogErro, GetFileCode } from './../globais/logs';
import * as fs from 'fs';
const cors = require('cors');
const bodyParser = require('body-parser');
import { execSQL } from '../globais/dbconn';
//app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
//set port
app.set("port", SocketConfig.socket_porta);
//cors credentials
app.use(cors({ credentials: true }));

import { setRoutes } from "./routers";
setRoutes(app);

//routers api integration
import routeApiCompanyIntegration from './../integration-company-api/route-api-company-integration';
routeApiCompanyIntegration(app);

//routes api whatssap
// import { routesApiWhatssap } from './../whatsappApi/routes-api-whatssap';
// routesApiWhatssap(app);

//routers facebook
// routers-facebook
// import { routersFacebook } from './../facebook/routers-facebook';
// routersFacebook(app);


var https = require('http').Server(app);

if (SocketConfig.ssl) {
  const privateKey = fs.readFileSync(SocketConfig.privateKey, 'utf8');
  const certificate = fs.readFileSync(SocketConfig.certificate, 'utf8');
  const ca = fs.readFileSync(SocketConfig.ca, 'utf8');
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };

  https = require('https').Server(credentials, app);
}

export const io = require('socket.io')(https);
import * as dataTempo from 'node-datetime';
import {
  agenteLogin,
  desconectar,
  cancelarPausa,
  programarPausa,
  userSendMsg,
  agentePausa,
  removeAgenteSocket
} from './../controllers/agente-controller';
import {
  checkAtendimentos,
  getMensagens,
  finalizaAtendimento,
  clienteLogin,
  reqListUra,
  checkAgenteDisponivel,
  setAgenteAtendimento
} from "./../controllers/atendimento-controller";
import {
  reinicializar,
  updateConfig,
  desativar,
  getAtendimentosSemana,
  checkContatos,
  updateRemetenteId,
  getBrowser,
  reniciarTronco
} from "./../controllers/remetente-controller";
import inicializacao from "./../inicializacao";
import {
  getRemetenteById,
  RemetenteTipo
} from "./../models/remetente-model";
import { getAtendimentoById, getAtendimentosByEmpresaId, getAtendimentos } from "./../models/atendimento-model";
import { gravaMensagem } from './../controllers/mensagem-service';
import { getAgenteById, getAgenteBySocket, Agente, getAgentesByGrupoId, getAgentesByEmpresaId } from "./../models/agente-model";
import { transferenciaAtendimento } from "./../whatsapp/transferenciaAtendimento";
import {
  intervencaoSupervisor,
  updateIntervencaoSupervisor,
  encerrarIntervencaoSupervisor
} from './../whatsapp/intervencaoSupervisor';

import {
  liberarAtedimentoPendente,
  finalizarAtendimentoPendente
} from './../whatsapp/atendimentos-pendentes';
import {
  verificaUraWeb,
  retornoListaUraWeb,
  ligarClienteChatWeb,
  iniciarWhatsAppChatWeb,
  webAtendimentoNaoInicado
} from './../controllers/web-controller';
import { listAtendimentosFinalizados } from './../whatsapp/atendimentos-finalizados/lista-atm-finalizado';
import { iniciaNewAtendimento } from './../whatsapp/iniciar-atendimento/inicia-atendimento';
import {
  insertHorarioFuncionamentoController,
  updateHorarioFuncionamentoController
} from "./../controllers/horario-funcionamento-controller";
import { finalizarAtmClientWeb } from './../services/finaliza-atendimento-web';
import { setTimeout } from "timers";
import { database } from "./conexao";

import { getWeekChartSerie } from '../models/charts-model';

import { delAtendimento } from '../models/atendimento-model';


io.on('connection', function (socket: any) {
  console.log('Nova conexão: ' + socket.id);
  socket.emit('connection_success');

  //Eventos agente
  socket.on('userLogin', usuario => {
    console.log('### Login do Usuário: ' + usuario.nome);
    usuario.socket_id = socket.id;

    agenteLogin(usuario)
      .then((agente) => {
        checkAtendimentos(agente, true)
          .then(() => {
            Log('Agente: ' + agente.id + ' logou!');
            socket.emit('userLoginResp');
          })
          .catch(error => {
            LogErro('Erro no Login do agente', error);
            socket.emit('userLoginError', error.stack)
          });
      })
      .catch((error: Error) => {
        LogErro('Erro no Login do agente', error);
        socket.emit('userLoginError', error.stack)
      });
  });

  socket.on('cancelarPausaProgramada', usuario => {
    (async () => {
      cancelarPausa(usuario)
        .then(() => {
          socket.emit('cancelarPausaProgramadaResp', JSON.stringify({ success: true }));
        })
        .catch(error => {
          socket.emit('cancelarPausaProgramadaResp', JSON.stringify({ success: false }));
        });
    })();
  });

  socket.on('finalizaPausa', usuario => {
    cancelarPausa(usuario)
      .then(() => {
        socket.emit('finalizaPausaResp', JSON.stringify({ success: true }));
      })
      .catch(error => {
        socket.emit('finalizaPausaResp', JSON.stringify({ success: false }));
      });
  });

  socket.on('programaPausa', pausa => {
    programarPausa(pausa)
      .then((pausaId) => {
        socket.emit('userPaused', JSON.stringify({ usuario_id: pausa.usuario_id, success: true, pausa_id: pausaId }));
      })
      .catch(error => {
        socket.emit('userPaused', JSON.stringify({ usuario_id: pausa.usuario_id, success: false, erro: error.toString() }));
      });
  });


  socket.on('userSendMsg', msg => {
    // console.log('verificar msg new campos: ',msg);    
    userSendMsg(msg)
      .catch(error => {
        LogErro('Não foi possível enviar a mensagem. Tente novamente!', error);
        socket.emit('userSendMsgResponse', 'Não foi possível enviar a mensagem. Tente novamente!', msg.msg_id);
      });
  });

  socket.on('getMensagens', (cliente_id, tronco_id, protocolo) => {
    getMensagens(cliente_id, tronco_id, protocolo)
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
    getMensagens(cliente_id, tronco_id, protocolo)
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
    removeAgenteSocket(socket.id);
  });

  socket.on('disconnect', () => {
    removeAgenteSocket(socket.id);
  });

  socket.on('deslogaUsuario', (agente_id) => {
    console.log('deslogando usuario com id ', agente_id);
    desconectar(socket.id, agente_id);
  });

  socket.on('reinicializar', (empresa_id) => {
    reinicializar(empresa_id);
  });


  socket.on('empConfig', empresa_id => {
    updateConfig(empresa_id);
  });

  socket.on('openBrowser', operacao => {
    inicializacao(operacao.id);
  });

  socket.on('desativar', operacao => {
    // console.log('lista de operacao: ' + operacao.id + 'remetent - empresa ' + operacao.empresa_id)
    desativar(operacao.id)
      .then(() => {
        socket.emit('desativarResponse', JSON.stringify({ success: true, remetente_id: operacao.id }));
      })
      .catch(error => {
        socket.emit('desativarResponse', JSON.stringify({ success: false, remetente_id: operacao.id, erro: error.toString() }));
      })
  });

  socket.on('updateGrupo', empresa_id => {
    reinicializar(empresa_id);
  });

  socket.on('getAtendimentosSemana', (parametro) => {
    //getAtendimentosSemana(parametro.empresa_id)
    getWeekChartSerie(parametro.empresa_id)
      .then(atendimentos => {
        console.log(JSON.stringify(atendimentos));
        if (atendimentos)
          io.emit('getAtendimentosSemanaResp', parametro.empresa_id, atendimentos);
      })
      .catch(error => {
        LogErro('Erro ao pega atendimentos da semana', error);
      });
  });

  socket.on('finalizaAtedimento', pAtendimento => {
    (async () => {
      let dt = dataTempo.create();
      let data = dt.format('Y-m-d H:M:S');
      let atendimento = await getAtendimentoById(pAtendimento.id);
      if (!atendimento) {
        let idAgent: number;
        let supervisorid: number;
        if (atendimento.agente_id) {
          if (atendimento.agente_id == pAtendimento.agente_id) {
            idAgent = pAtendimento.agente_id;
            supervisorid = 0;
          } else {
            supervisorid = pAtendimento.agente_id;
            idAgent = atendimento.agente_id;
          }
        } else {
          idAgent = pAtendimento.agente_id
        }

        let agente = await getAgenteById(idAgent);

        agente.qtdEmAtendimento = (agente.qtdEmAtendimento > 0 ? agente.qtdEmAtendimento - 1 : 0);
        await database.query("update tb_usuario set qtd_atendimentos=IF(qtd_atendimentos-1 < 0,0,qtd_atendimentos-1) where id=" + agente.id);

        io.emit('atendimentoFinalizado', JSON.stringify({
          usuario_id: idAgent,
          supervisor_id: supervisorid,
          protocolo: pAtendimento.protocolo
        }));

        await checkAtendimentos(agente, false);
        return;
      } else {
        if(!atendimento.datahora_fila){
          atendimento.datahora_fila = data;
        }
        if(!atendimento.datahora_atendimento){
          atendimento.datahora_atendimento = data;
        }
      }

      if (atendimento.intervencao_supervisor_id == pAtendimento.agente_id) {
        await encerrarIntervencaoSupervisor(atendimento.id, socket);
      }

      let remetente = await getRemetenteById(atendimento.remetente_id);

      await finalizaAtendimento(atendimento, false);

      if (atendimento.tipo == 'WHATSAPP') {
        if (atendimento.chave == 'ChaveFalse') {
          await remetente.page.evaluate('sendMessageToNumber("' + atendimento.numero + '","' + remetente.config.msg_forcar_finalizar_atendimento + '");');
        } else {
          await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_forcar_finalizar_atendimento + '");');
        }

      } else {
        io.emit('attendTerminate', {
          id: atendimento.chave,
          mensagem: remetente.config.msg_forcar_finalizar_atendimento
        });
      }

      Log('Atendimento: ' + atendimento.id + ' finalizado');
      io.emit('atendimentoFinalizado', JSON.stringify({
        usuario_id: atendimento.agente_id,
        protocolo: atendimento.protocolo,
        supervisor_id: (atendimento.intervencao_supervisor_id == pAtendimento.agente_id ? atendimento.intervencao_supervisor_id : '0')
      }));

    })();
  });

  socket.on('clienteDesistiu', atendimento => {
    (async () => {
      let atend = await getAtendimentoById(atendimento.id);
      finalizaAtendimento(atend, false);
    })();
  });

  socket.on('checkContatos', campanha_id => {
    checkContatos(campanha_id);
  });

  // ###SYSTEM ## FOR ## WEB###
  socket.on('cadastroWebAtendimentoNaoInicado', dadosCliente => {
    // cadastrar os dados do cliente
    webAtendimentoNaoInicado(dadosCliente);
  })

  socket.on('verificaUraWeb', (tronco_id, empresa_id) => {
    verificaUraWeb(tronco_id, empresa_id);
  });

  socket.on('reqListUra', (empresa_id, cpf_cliente) => {
    //create the method to list of ura
    // console.log('empresa id req ura: ' + empresa_id);
    retornoListaUraWeb(empresa_id, cpf_cliente);
  });

  socket.on('reqLigarClienteChatWeb', (cliente, config) => {
    console.log('cliente: ', cliente);
    console.log('config: ', config);
    ligarClienteChatWeb(cliente, config);
  });

  socket.on('reqIniciarWhatsAppChatWeb', (cliente, tronco_id) => {
    console.log('cliente: ', cliente);
    console.log('config: ', tronco_id);
    iniciarWhatsAppChatWeb(cliente, tronco_id);
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
    clienteLogin(cliente, socket)
      .catch(error => {
        socket.emit('clienteLoginResp', {
          success: false,
          cause: 'ERRO',
          erro: error.toString()
        });
      });
  });



  socket.on('msgSend', (message, atend) => {
    (async () => {
      let remetente = await getRemetenteById(atend.remetente_id);
      let atendimento = await getAtendimentoById(atend.id);
      let dt = dataTempo.create();
      let data = dt.format('Y-m-d H:M:S');

      // method finalizar pelo cliente
      // await finalizarAtmClientWeb(atendimento.id, message.msg);

      gravaMensagem(atendimento, 'CLIENTE', message.msg, 'CI_' + atendimento.cliente.id + data, 0, data, '', '', '', 'False', 'False', 'texto', 'null');
    })()
  });

  socket.on('transferirGrupoFila', (atendimento_id, agente_transferencia_id, grupo_id, remetente_id) => {
    // chamar a classe de transferencia
    console.log('transferencia: ', atendimento_id, agente_transferencia_id, grupo_id, remetente_id);
    transferenciaAtendimento(atendimento_id, agente_transferencia_id, grupo_id, remetente_id, socket);
  });

  socket.on('atendimentoIntervencaoSupervisor', (atendimento_id) => {
    console.log('antendimento_id intervencao: ' + atendimento_id);
    // chamar intervenção do supervisor
    intervencaoSupervisor(atendimento_id, socket);
  });

  socket.on('updateRemetenteId', (remetente_id) => {
    //update of the table remetent(tronco)
    (async () => {
      console.log('atualizou o agente')
      updateRemetenteId(remetente_id);
    })()
  });

  socket.on('updateIntervencao', (atendimento_id) => {
    updateIntervencaoSupervisor(atendimento_id);
  });

  socket.on('encerrarIntervencao', (atendimento_id) => {
    // (async () => {
    //   await encerrarIntervencaoSupervisor(atendimento_id,socket);
    //   socket.emit('encerrarIntervencaoResp', atendimento_id);
    // });
    encerrarIntervencaoSupervisor(atendimento_id, socket);
  });

  socket.on('liberarAtendimentoPendente', (atendimento_id) => {
    console.log('liberarAtendimentoPendente ', atendimento_id);
    liberarAtedimentoPendente(atendimento_id)
  });

  socket.on('finalizarAtendimentoPendente', (atendimento_id) => {
    console.log('finalizarAtendimentoPendente ', atendimento_id);
    finalizarAtendimentoPendente(atendimento_id)
  });

  socket.on('logout', troncoIdEmpresaId => {
    console.log('troncoEmpresaId: ', troncoIdEmpresaId);
    (async () => {
      let tronco = await getRemetenteById(troncoIdEmpresaId.id);
      // console.log(tronco);
      // if (tronco.tipo == RemetenteTipo.WHATSAPP) {
      //   tronco.page.evaluate('logout();');
      // }
    })();
  });

  socket.on("updateQrCode", (tronco_id) => {
    // console.log('update qrCode: ',tronco_id);
    (async () => {
      let tronco = await getRemetenteById(tronco_id);
      // await inicializacao(tronco_id);
      if (tronco.page) {
        tronco.page.close();
      }
      if (tronco.browser) {
        tronco.browser.close();
      }

      console.log('### updateQrCode');
      getBrowser(tronco);
      // reinicializar(tronco.empresa_id);
    })()
  });

  // socket.on("listAtendimentoFinalizados", (agente_id, empresa_id) => {
  //   //criar uma classe para tratar os atm finalizados
  //   listAtendimentosFinalizados(agente_id, empresa_id);
  // });

  socket.on("beginNewAtendimento", (iniciaNewAtm) => {
    console.log('destinoNovoAtm: ', iniciaNewAtm.destino);
    iniciaNewAtendimento(iniciaNewAtm.destino, iniciaNewAtm.tronco_id, iniciaNewAtm.mensagem, iniciaNewAtm.agente_id);
  });

  socket.on("listClientesIniciar", agente_id => {
    console.log('list cliente id ', agente_id);
    //criar um service para list of client
  });

  socket.on("insertHorariosFuncinamento", horariosFunc => {
    console.log('horariosFunc: ', horariosFunc);
    insertHorarioFuncionamentoController(horariosFunc);
  });

  socket.on("updateHorariosFuncionamento", horariosFunc => {
    console.log('horariosFunc: ', horariosFunc);
    updateHorarioFuncionamentoController(horariosFunc);
  });

  socket.on("GetAllAtt", (empresa_id) => {
    (async () => {
      let sText: string = '\n';
      sText += '________________________________________________\n';
      sText += '### EMPRESA ID - ATENDIMENTOS ###\n';
      sText += empresa_id + '\n';
      sText += '________________________________________________\n';
      Log(sText);
      let atendientos = await getAtendimentosByEmpresaId(empresa_id);

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
      Log(sText);

      socket.emit('ResAllAtt', atendientos);

    })();

  });

  socket.on("GetAllUsers", (empresa_id) => {
    (async () => {
      let sText: string = '\n';
      sText += '________________________________________________\n';
      sText += '### EMPRESA ID - USUÁRIOS ###\n';
      sText += empresa_id + '\n';
      sText += '________________________________________________\n';
      Log(sText);
      let agentes = await getAgentesByEmpresaId(empresa_id);
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
      Log(sText);

      socket.emit('ResAllUsers', agentes);

    })();

  });

  socket.on("SetAttToUser", (atendimento_id, agente_id) => {
    (async () => {
      let dt = dataTempo.create();
      let data = dt.format('Y-m-d H:M:S');
      let sText: string = '\n';
      sText += '________________________________________________\n';
      sText += '### ENVIO DE ATENDIMENTO MANUAL ###\n';
      sText += 'Atendimento: ' + atendimento_id + ' - Agente: ' + agente_id + '\n';

      const atendimento = await getAtendimentoById(atendimento_id);
      const agente = await getAgenteById(agente_id);
      if (atendimento && agente) {
        atendimento.retirar_pendente = true;
        atendimento.grupo_id = agente.grupo_id;
        if(!atendimento.datahora_fila){
          atendimento.datahora_fila = data;
        }
        
        await setAgenteAtendimento(agente, atendimento);
        sText += 'Concluido com exito!\n';
      } else {
        sText += 'Falha no envio!\n';
      }
      sText += '________________________________________________\n';
      Log(sText);
    })();

  });

  socket.on("DelAttToArray", (atendimento_id) => {
    (async () => {

      let atendimento = await getAtendimentoById(atendimento_id);
      if(atendimento){
        await delAtendimento(atendimento);
      }

    })();

  });

  socket.on("getStatusTruck", (tronco_id) => {
    console.log('### (Socket): getStatusTruck: ', tronco_id);
    (async () => {

      let teste = await execSQL('select * from tb_usuario');
      console.log('___________________________________');
      for (let index = 0; index < teste.length; index++) {
        const sLine = teste[index];
        if (sLine.nome != ''){
          console.log(sLine.nome);
        }
      }
      console.log('___________________________________');


    })();

  });


});

https.listen(SocketConfig.socket_porta, function () {
  Log('Servidor iniciado na porta: ' + SocketConfig.socket_porta);
});

// https.listen(8582, function () {
//   Log('Servidor iniciado na porta: 8582');
// });