import { checkNumero } from "./../globais/funcs";
import { database } from './conexao';
import * as express from "express";
import { LogErro } from "./../globais/logs";
import { desconectar } from "./../controllers/agente-controller";
import { getAgenteById } from "./../models/agente-model";

export const setRoutes = function (app: express.Application) {

    app.post('/postMensagem', function (req, res) {
        postMensagem(req.body)
            .then(() => {
                res.send({
                    success: true
                });
            })
            .catch(error => {
                LogErro('Erro ao salvar mensagem offline!',error);
                res.send({
                    success: false,
                    erro: error.toString()
                });
            });
    }); 
    
    // rota de deslogar agente front end
    app.post('/logout-agente', async (req, res) => {
        console.log('rota de login');
        console.log('req body: ',req.body);
        let agente = await getAgenteById(req.body.usuario_id);
        console.log(agente);
        if (agente) {
            await desconectar(agente.socket, req.body.usuario_id);
            res.json({ result: true });
        } else {
            res.json({ result: false });
        }
    });

    // rota de login de agente mobile
    app.post('/login', async (req, res) => {
        console.log(req.body);
        let chave = 'SOMASAC_MOBILE1A2B3C4D5E6F7G8H9I10JWELLITEL_6105';
        if (chave === req.body.chave) {
            // continue o resto
            let usuario = req.body.usuario;
            let senha = req.body.senha;
            let dadosUsuer = await database.query("select * from tb_usuario where usuario = '"+usuario+"' and senha = '"+senha+"'");
            if (dadosUsuer[0][0]) {
                // tenho um usuario
                if (dadosUsuer[0][0].nivel === 'AGENTE') {
                    if (dadosUsuer[0][0].permitir_app_mobile == 'True') {
                        // tem permissao
                        res.json({ result: 'success', usuario: dadosUsuer[0][0], msg: 'Login realizado com sucesso' });
                    } else {
                        // deu error com força
                        res.json({ result: 'error', usuario: [], msg: 'Error nao tem a perissao de acesso' });
                    } 
                } else {
                    //nao tem permissao
                    res.json({ result: 'error', usuario: [], msg: 'Error nao tem a perissao de acesso' });
                }                
            } else {
                // deu error com força
                res.json({ result: 'error', usuario: [], msg: 'Error nao existe usuario, ou tem error no usuario ou senha' });
            }            
        } else {
            // deu error com força
            res.json({ result: 'error', usuario: [], msg: 'Error nao tem a chave de perissao' });
        }        
    });

    // rota de conversas agente mobile
    app.get('/conversas', (req, res) => {
        //
    });
}


const postMensagem = async (parametros) => {
    let data = new Date();
    let dhInicio = new Date(parametros.cliente.data_inicio);

    let protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
        checkNumero(data.getDate()).toString() + (parametros.cliente.cpf) ? parametros.cliente.cpf.substring(0, 4) : 36912
        + checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
        + checkNumero(data.getSeconds()).toString();

    let dt = data.getFullYear().toString() + '-' + checkNumero(data.getMonth() + 1).toString() + '-' +
        checkNumero(data.getDate()).toString() + ' ' + checkNumero(data.getHours()).toString() + ':' +
        checkNumero(data.getMinutes()).toString() + ':' + checkNumero(data.getSeconds()).toString();

    let dtInicio = dhInicio.getFullYear().toString() + '-' + checkNumero(dhInicio.getMonth() + 1).toString() + '-' +
        checkNumero(dhInicio.getDate()).toString() + ' ' + checkNumero(dhInicio.getHours()).toString() + ':' +
        checkNumero(dhInicio.getMinutes()).toString() + ':' + checkNumero(dhInicio.getSeconds()).toString();
    let idCliente = 0;
    let dadoCliente: any = await database.query("select * from tb_cliente where cpf = '" + parametros.cliente.cpf + "' and empresa_id = " + parametros.cliente.empresa_id);

    if (dadoCliente![0]![0]) {
        idCliente = dadoCliente[0][0].id;
        await database.query("update tb_cliente set telefone = " +
            (parametros.cliente.telefone ? '\'' + parametros.cliente.telefone + '\'' : 'telefone') +
            ", email = " + (parametros.cliente.email ? '\'' + parametros.cliente.email + '\'' : 'email') +
            " where id = " + idCliente);

        await gravaAtendimento({
            protocolo: protocolo,
            dtInicio: dtInicio,
            dtAtual: dt,
            grupo_id: parametros.cliente.grupo_id,
            empresa_id: parametros.cliente.empresa_id,
            cliente_id: idCliente,
            mensagem: parametros.mensagem
        });
    } else {
        await database.query("INSERT  INTO tb_cliente (nome, cpf, telefone,empresa_id,whatsapp_id, whatsapp_url_avatar,email) values ('" +
            parametros.cliente.nome + "','" + parametros.cliente.cpf + "', '" + parametros.cliente.telefone + "', " + parametros.cliente.empresa_id +
            ",'','','" + parametros.cliente.email + "')");
        let dadoCliente: any = await database.query("select * from tb_cliente where cpf = '" + parametros.cliente.cpf + "' and empresa_id = " + parametros.cliente.empresa_id);

        idCliente = dadoCliente[0][0].id;
        await gravaAtendimento({
            protocolo: protocolo,
            dtInicio: dtInicio,
            dtAtual: dt,
            grupo_id: parametros.cliente.grupo_id,
            empresa_id: parametros.cliente.empresa_id,
            cliente_id: idCliente,
            mensagem: parametros.mensagem
        });
    }
}


const gravaAtendimento = async (atendimento) => {
    await database.query("insert into tb_atendimento (protocolo, datahora_inicio, datahora_fila, datahora_fim, grupo_id, empresa_id, tipo, cliente_id, cliente_finalizou) values ('" +
        atendimento.protocolo + "', '" + atendimento.dtInicio + "', '" + atendimento.dtInicio + "', '" + atendimento.dtAtual + "', " + atendimento.grupo_id + ", " + atendimento.empresa_id +
        ", 'OFFLINE', " + atendimento.cliente_id + ", 'False');");
    let dadoAtendimento: any = await database.query("select * from tb_atendimento where protocolo = '" + atendimento.protocolo + "'");
    let idAtendimento = dadoAtendimento[0][0].id;

    await database.query("insert into tb_mensagem (atendimento_id,origem, origem_id, datahora_envio, mensagem, empresa_id, mensagem_id, whatsapp_id) values " +
        "(" + idAtendimento + ", 'CLIENTE', " + atendimento.cliente_id + ", '" + atendimento.dtAtual + "', 'ASSUNTO: " + atendimento.mensagem.assunto + " <br> MENSAGEM: " + atendimento.mensagem.msg +
        "', " + atendimento.empresa_id + ", '" + 'CI_' + atendimento.cliente_id + '_' + atendimento.dtAtual + "', '" + 'CI_' + atendimento.cliente_id + '_' + atendimento.dtAtual + "')");
}