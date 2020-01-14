import { Remetente } from "models/remetente-model";
import { database } from './../libs/conexao';
import * as dataTempo from 'node-datetime';
import { Log } from './../globais/logs';
//tb_chamadas_perdidas

export const chamadasPerdidas = async (mensagem, tronco: Remetente) => {
    // console.log('chamadas perdidas: ',mensagem);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("insert into tb_chamadas_perdidas (tronco_id, tronco, tronco_number, datahora_chamada, origem, nome_origem, img_origem, chat_id, empresa_id) values (" +
        tronco.id + ", '" + tronco.descricao + "', '" + tronco.remetente + "', '" + data + "', '" + mensagem.number + "', "+
        " '" + (mensagem.profileName ? mensagem.profileName : mensagem.name) + "', '" + mensagem.avatarUrl + "', '" + mensagem.chatId + "', " + tronco.empresa_id + ");");

    Log('Chamada Perdida | Remetente: ' + tronco.descricao + ' | Origem: ' + (mensagem.profileName ? mensagem.profileName : mensagem.name) + ' (' + mensagem.number + ')');
}