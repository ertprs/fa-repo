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
const conexao_1 = require("../libs/conexao");
var request = require('request');
exports.getUserInfo = (atendimento, tronco) => __awaiter(void 0, void 0, void 0, function* () {
    let url = "https://graph.facebook.com/" + atendimento.chave + "?fields=first_name,last_name,profile_pic&access_token=" + tronco.token;
    request(url, function (error, response, body) {
        console.log('error: ', error); // Print the error if one occurred
        console.log('statusCode: ', response && response.statusCode); // Print the response status code if a response was received
        console.log('body: ', body); // Print the HTML for the Google homepage.
        body = JSON.parse(body);
        body.profile_pic = body.profile_pic.replace('\'', "");
        atendimento.nome = body.first_name;
        atendimento.avatar = body.profile_pic;
        console.log('atm get-user-info: ', atendimento);
    });
    let dadosCliente = yield conexao_1.database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
        "and empresa_id = " + atendimento.empresa_id);
    // console.log(dadosCliente);
    if (dadosCliente[0][0]) {
        yield conexao_1.database.query("update tb_cliente set telefone = '" + atendimento.numero +
            "', facebook_id = '" + atendimento.chave + "', whatsapp_url_avatar = '" + atendimento.avatar +
            "', cpf = if(cpf <> '', cpf, '" + atendimento.cpf + "')" +
            "  where facebook_id = '" + atendimento.chave + "' " +
            " and empresa_id = " + atendimento.empresa_id);
        dadosCliente = yield conexao_1.database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    else {
        conexao_1.database.query("INSERT INTO tb_cliente (nome, cpf, telefone,empresa_id,facebook_id, whatsapp_url_avatar) values ('" +
            atendimento.nome + "','" + atendimento.cpf + "', '" + atendimento.numero + "', " + atendimento.empresa_id +
            ",'" + atendimento.chave + "','" + atendimento.avatar + "')");
        dadosCliente = yield conexao_1.database.query("select * from tb_cliente where facebook_id = '" + atendimento.chave + "' " +
            "and empresa_id = " + atendimento.empresa_id);
    }
    atendimento.cliente = dadosCliente[0][0];
});
//# sourceMappingURL=get-user-info.js.map