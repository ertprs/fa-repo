import { Log } from '../globais/logs';
import { database } from '../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Atendimento } from './../models/atendimento-model';
import { Remetente } from './../models/remetente-model';
var request = require('request');

export const getUserInfo = async (atendimento: Atendimento, tronco: Remetente) => {
    
    let url = "https://graph.facebook.com/"+atendimento.chave+"?fields=first_name,last_name,profile_pic&access_token="+tronco.token;

    request(url, function (error, response, body) {
        console.log('error: ', error); // Print the error if one occurred
        console.log('statusCode: ', response && response.statusCode); // Print the response status code if a response was received
        console.log('body: ', body); // Print the HTML for the Google homepage.
        body = JSON.parse(body);
        body.profile_pic = body.profile_pic.replace('\'', "");
        atendimento.nome = body.first_name;
        atendimento.avatar = body.profile_pic;

        console.log('atm get-user-info: ',atendimento);
    });  

    let dadosCliente: any = await database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    
    // console.log(dadosCliente);

    if (dadosCliente![0]![0]) {
        await database.query("update tb_cliente set telefone = '" + atendimento.numero +
            "', facebook_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
            "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
            "  where facebook_id = '" + atendimento.chave + "' " +
            " and empresa_id = " + atendimento.empresa_id);
        dadosCliente = await database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    } else {
        database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,facebook_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadosCliente = await database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }

    atendimento.cliente = dadosCliente![0]![0];
}