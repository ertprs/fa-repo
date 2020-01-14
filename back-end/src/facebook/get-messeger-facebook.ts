import { getRemetenteByMyNumber } from "./../models/remetente-model";
import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { 
    getAtendimentoByChaveRemetenteId, 
    getAtendimentoById,
    Atendimento,
    addAtendimento
} from './../models/atendimento-model';
import { tratarPreAtendimentoFacebook } from "./tratar-pre-atendimento";
import { getUserInfo } from "./get-user-info";

export const getMessegerFacebook = async (messeger) => {
    console.log('mensagem: ',messeger.messaging[0].message); 
    console.log('mensagem id: ',messeger.id);
    // recebe as mensagens e verifica 
    let dt = dataTempo.create();

    //pegar o tronco 
    let tronco = await getRemetenteByMyNumber(messeger.id);
    
    if (messeger.messaging[0].sender.id == tronco.mynumber) return ;

    var atendimento = await getAtendimentoByChaveRemetenteId(messeger.messaging[0].sender.id, tronco.id);

    let transfer_atm: any = await database.query("select * from tb_atendimento where cliente_chave = '" + messeger.messaging[0].sender.id + "' " +
    "and datahora_fim is null order by id desc limit 1");

    if (transfer_atm[0][0]) {
        // console.log('eu sou foda id atm: ',transfer_atm[0][0].id)
        atendimento = await getAtendimentoById(transfer_atm[0][0].id);        
    } else {
        let temAtendimento: any = await database.query("select count(*) as qtd from tb_atendimento a where a.cliente_chave = '" + messeger.messaging[0].sender.id + "' and a.datahora_fim " +
        "is not null and TIMESTAMPDIFF(second, a.datahora_fim, '" + dt.format('Y-m-d H:M:S') + "') < 60 order by  id desc limit 1");
        if (temAtendimento![0]![0].qtd > 0) return Log('Atendimentos anteriores');
    }

    if (atendimento) {
        if (!atendimento.preAtendimento) {
            // console.log('tratar o preatendimento');
            await tratarPreAtendimentoFacebook(atendimento, messeger, tronco);
        } else {
            // trataraendimento
            // console.log('tratar o atendimento');
            // await tratarAtendimento(atendimento, mensagem,remetente_id);
        }
    } else {
        console.log('novo atm indo get user')
        let data = dt.format('Y-m-d H:M:S');
        var novoAtendimento: Atendimento = {
            id: 0,
            emEntendimento: false,
            // nome: messeger.messaging[0].sender.id,
            numero: messeger.messaging[0].sender.id,
            // avatar: message.avatarUrl,
            nivel: 0,
            empresa_id: tronco.empresa_id,
            grupo_id: tronco.grupo_id,
            remetente_id: tronco.id,
            datahora_inicio: data,
            tipo: 'FACEBOOK',
            chave: messeger.messaging[0].sender.id
        };

        await addAtendimento(novoAtendimento);
        // await getUserInfo(novoAtendimento,tronco);
        await tratarPreAtendimentoFacebook(novoAtendimento, messeger, tronco);
    }
    Log('Nova Mensagem | Remetente: ' + tronco.descricao + '| Origem: Facebook - ' + messeger.messaging[0].sender.id);    
}