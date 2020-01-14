import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { io } from './../libs/io';
import { getRemetenteById } from './../models/remetente-model';

export const webAtendimentoNaoInicado = async (dadosCliente) => {
    console.log('dados do cliente: ', dadosCliente);
}

export const verificaUraWeb = async (tronco_id, empresa_id) => {
    console.log(tronco_id + ' - ' + empresa_id);
    let tronco = await getRemetenteById(tronco_id);
    console.log('tronco.config.permitir_ura :',tronco.config.permitir_ura);
    if (tronco.config.permitir_ura == 0) {
        io.emit('resultUraWeb', {result : 'error'});
    } else {
        let dadosUraWeb = await database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");

        if (dadosUraWeb[0]){ io.emit('resultUraWeb', {result : 'success'}); } else io.emit('resultUraWeb', {result : 'error'});        
    }
}

export const retornoListaUraWeb = async (empresa_id, cpf_cliente) => {
    let dadosUra: any = await database.query("select * from tb_ura where empresa_id = '" + empresa_id + "'");
    //console.log('dados ura: ' +  JSON.stringify(dadosUra[0]));
    io.emit('respListUra', JSON.stringify(dadosUra[0]), cpf_cliente);
}

export const ligarClienteChatWeb = async (cliente, config) => {
    console.log('cliente: ',cliente);
    console.log('config: ',config);
    io.emit('resLigarClienteChatWeb', {success: 'success', msg: 'Entraremos em contato, em horário comercial!'})
}

export const iniciarWhatsAppChatWeb = async (cliente, tronco_id) => {
    console.log('cliente: ',cliente);
    console.log('tronco_id: ',tronco_id);
    let dt = dataTempo.create(cliente.data_inicio);
    let data = dt.format('Y-m-d H:M:S');
    let tronco = await getRemetenteById(tronco_id);
    let mensagem = 'Olá seja bem vindo ao SomaSac nossa central de relacionamento via WhatsApp. Como podemos lhe ajudar?';

    await tronco.page.evaluate('sendMessageToNumber("' + cliente.telefone + '","' + mensagem.trim().replace(/(?:\r\n|\r|\n)/g, '\\n') + '");');
    io.emit('inicioAtendimentoWebWhatsApp', { result: true });
}
