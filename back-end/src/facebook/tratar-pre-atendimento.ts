
import { Atendimento, getAtendimentoByChave } from './../models/atendimento-model';
import { Remetente } from './../models/remetente-model';
import { 
    getPeriodoDia, 
    valida_cpf_cnpj, 
    get_cpfcnpj,
    checkNumero 
} from './../globais/funcs';
import { iniciaAtendimento, reqListUraWA } from './../controllers/atendimento-controller';
import { getUserInfo } from './get-user-info';
import { gravaMensagem } from './../controllers/mensagem-service';
import { database } from './../libs/conexao';

export const tratarPreAtendimentoFacebook = async (
    atendimento: Atendimento,
    messeger,
    tronco: Remetente
) => {
    console.log('atm pre atm: ',atendimento);

    // tratar o pre-atendimento verificar a existencia da ura e mais...

    if (atendimento.controle_ura == undefined || atendimento.controle_ura == '' || atendimento.controle_ura == null) 
    {
        //iniciar o atm antes de entrar na ura
        atendimento.controle_ura = 'exist';
        atendimento.cpf = '';

        // method of the check client
        await getUserInfo(atendimento,tronco);

        let data = new Date();

        let sProtocolo = await database.query("CALL sp_getprotocolo('"+atendimento.numero+"');");
        atendimento.protocolo = sProtocolo[0][0][0].protocolo;
        
        // atendimento.protocolo = data.getFullYear().toString() + checkNumero(data.getMonth() + 1).toString() +
        //     checkNumero(data.getDate()).toString() + (atendimento.cpf ? atendimento.cpf.substring(0, 4) : '') + 
        //     checkNumero(data.getHours()).toString() + checkNumero(data.getMinutes()).toString() +
        //     + checkNumero(data.getSeconds()).toString();

        
        atendimento = await getAtendimentoByChave(atendimento.chave);
        // console.log('atm depois get user: ', atendimento); 

        await iniciaAtendimento(atendimento);
    }

    // ###### CREATE URA     messeger.messaging[0].message
    // const dadosUra: any = await reqListUraWA(tronco.empresa_id);

    // if (tronco.config.permitir_ura == 0) {
    //     console.log('nao tem ura ok');
    //     dadosUra[0][0] = '';
    // } 


    // if (dadosUra[0][0]) {
    //     //tem ura
    //     let msgUra = '';
    // } else {
    //     //nao tem
    //     console.log('grupo_id em remetente: ' + tronco.grupo_id);
    //     console.log('grupo_id em atendimento: ' + atendimento.grupo_id);
    //     await gravaMensagem(atendimento, 'CLIENTE', messeger.messaging[0], messeger.messaging[0].sender.id, 0, null,'', '', '', 'False', 'False', 'null');
    // }
}