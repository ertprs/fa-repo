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
const remetente_model_1 = require("./../models/remetente-model");
const funcs_1 = require("./../globais/funcs");
const iniciaAtendimentoWA_1 = require("./iniciaAtendimentoWA");
const atendimento_controller_1 = require("./../controllers/atendimento-controller");
const mensagem_service_1 = require("./../controllers/mensagem-service");
const horario_funcionamento_controller_1 = require("./../controllers/horario-funcionamento-controller");
const conexao_1 = require("./../libs/conexao");
exports.tratarPreAtendimento = (atendimento, mensagem, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
    // if (mensagem.messages[0].type != 'chat')
    //     return await remetente.page.evaluate('sendMessageToId("' + mensagem.chave + '","Nessa interação, só mensagem de texto é permitido!");');
    if (!atendimento.controle_ura && atendimento.atm_ura_presa == undefined) {
        //criar uma variavel de controle verifica ura...
        atendimento.controle_ura = 'exist';
        atendimento.cpf = '';
        yield atendimento_controller_1.checkClienteWA(atendimento);
        let data = new Date();
        let sProtocolo = yield conexao_1.database.query("CALL sp_getprotocolo('" + mensagem.number + "');");
        atendimento.protocolo = sProtocolo[0][0][0].protocolo;
        yield atendimento_controller_1.iniciaAtendimento(atendimento);
    }
    // ###### CREATE URA     
    const dadosUra = yield atendimento_controller_1.reqListUraWA(remetente.empresa_id);
    if (remetente.config.permitir_ura == 0) {
        dadosUra[0][0] = '';
    }
    // console.log('lista da ura: ' + dadosUra[0][0]);
    // console.log('atendimento view: ' + atendimento);    
    if (dadosUra[0][0]) {
        console.log('*************************** URA');
        //### VERIFICAR HORARIO DE FUNCIONAMENTO ###
        let horariosFuncionamentos = yield horario_funcionamento_controller_1.horarioFuncionamento(remetente_id);
        console.log('horariosFuncionamentos: ', horariosFuncionamentos);
        if (horariosFuncionamentos.status == false) {
            console.log('Não está dentro do horário: ', horariosFuncionamentos);
            //gravar mensgem
            for (let index = 0; index < mensagem.messages.length; index++) {
                const msg = mensagem.messages[index];
                if (msg.type == 'chat') {
                    yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                }
                else {
                    yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                }
            }
            //envio de mensagem fora do horario
            yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + horariosFuncionamentos.data.mensagem + '" );');
            return;
        }
        //criar um find com sub grupo vazio ou undefinn
        // console.log('mensage recebida: ' + mensagem.messages[0].message.trim().toUpperCase());
        // console.log('subgrupo: ' + dadosUra[0][0].sub_grupo_id);
        let msgUra = '';
        // console.log('ver o atendimento: ',atendimento)
        //novos campos: base64file file_name type_file exists_image exists_document
        for (let index = 0; index < mensagem.messages.length; index++) {
            const msg = mensagem.messages[index];
            if (msg.type == 'chat') {
                yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
            }
            else {
                yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
            }
            if (msg.message) {
                if (msg.message.trim().toUpperCase() == 'INICIO' || msg.message.trim().toUpperCase() == 'INÍCIO') {
                    atendimento.ura_id = '';
                }
            }
            // encerrar atm dentro da ura
            if (msg.type == 'chat') {
                console.log('palavra sair');
                if (msg.message.trim().toUpperCase() == remetente.config.funcao_encerrar_atendimento.toUpperCase()) {
                    yield atendimento_controller_1.finalizaAtendimento(atendimento, true);
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," Atendimento Finalizado com sucesso!" );');
                    return;
                }
            }
        }
        // console.log('ver atm: ',atendimento);
        //verificar se a funcao existe
        let existfuncaoUra = yield dadosUra[0].find(x => x.funcao == (mensagem.messages[0].message ? mensagem.messages[0].message.trim().toUpperCase() : mensagem.messages[0].message) && (atendimento.ura_id ? x.sub_grupo_id == atendimento.ura_id : x.sub_grupo_id == null));
        if (existfuncaoUra) {
            atendimento.ura_id = existfuncaoUra.id;
            msgUra = '';
            //criar um find para os sub grupos       
            let existSubGrupoUra = yield dadosUra[0].filter(x => x.sub_grupo_id == existfuncaoUra.id);
            console.log('existe sub grupo' + existSubGrupoUra);
            if (existSubGrupoUra[0]) {
                //mandar a msg aqui da ura sub grupo pegar msg e tratar o grupo
                // msgUra = existfuncaoUra.mensagem;
                msgUra = existfuncaoUra.mensagem + "\\nPara voltar ao inicio digite a palavra *inicio*.\\n ";
                for (let index = 0; index < existSubGrupoUra.length; index++) {
                    const element = existSubGrupoUra[index];
                    msgUra = msgUra + " \\n " + element.funcao + " = " + element.descricao;
                    // console.log(msgUra);
                }
                // console.log('antes de enviar mensagem');
                yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," ' + msgUra + '" );');
                for (let index = 0; index < mensagem.messages.length; index++) {
                    const msg = mensagem.messages[index];
                    yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msgUra, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                }
                return;
            }
            else {
                //verificar se existe um grupo atrelado aquela ura
                // let getIdGrupoUra = await reqIdGrupoUra(existfuncaoUra.id);
                let getIdGrupoUra = yield atendimento_controller_1.reqIdGrupoUra(atendimento.ura_id);
                if (getIdGrupoUra[0][0]) {
                    yield atendimento_controller_1.updateAtendimentoUraId(atendimento.id, existfuncaoUra.id, getIdGrupoUra[0][0].grupo_id);
                    atendimento.grupo_id = getIdGrupoUra[0][0].grupo_id;
                    atendimento.nivel = 0;
                    atendimento.preAtendimento = false;
                    console.log('tenho o novo grupo de atm; ', getIdGrupoUra[0][0].grupo_id);
                }
                else {
                    let msgUra2 = (existfuncaoUra.titulo ? existfuncaoUra.titulo + " - " + existfuncaoUra.descricao : existfuncaoUra.descricao) + ", não está configurado para atendimento.\\nPor favor escolha uma outra opção a baixo. ";
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," ' + msgUra2 + '" );');
                    for (let index = 0; index < mensagem.messages.length; index++) {
                        const msg = mensagem.messages[index];
                        yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msgUra2, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                    }
                    msgUra = '';
                    let rememberUra = yield dadosUra[0].filter(x => x.sub_grupo_id == existfuncaoUra.sub_grupo_id);
                    for (let index = 0; index < rememberUra.length; index++) {
                        const element = rememberUra[index];
                        msgUra = msgUra + "\\n" + element.funcao + " = " + element.descricao;
                    }
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," ' + msgUra + '" );');
                    for (let index = 0; index < mensagem.messages.length; index++) {
                        const msg = mensagem.messages[index];
                        yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msgUra, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                    }
                    // console.log('informar uma das opcões acima');
                    return;
                }
                // return ;
            }
        }
        else {
            // #### teste se houve troca de msg e verificar as opçoes a cima ####
            if (atendimento.ura_id) {
                // informar uma das opcões a baixo
                // console.log('atm ura: ',atendimento);
                let subGrupoUraId = yield dadosUra[0].find(x => x.id == atendimento.ura_id);
                let acharIdUra = yield dadosUra[0].find(x => x.funcao == (mensagem.messages[0].message ? mensagem.messages[0].message.trim().toUpperCase() : mensagem.messages[0].message) && x.sub_grupo_id == subGrupoUraId.sub_grupo_id);
                let getIdGrupoUra = yield atendimento_controller_1.reqIdGrupoUra((acharIdUra ? acharIdUra.id : subGrupoUraId.id));
                // console.log(getIdGrupoUra[0][0])
                if (getIdGrupoUra[0][0]) {
                    console.log('ura id: ', getIdGrupoUra[0][0].grupo_id);
                    yield atendimento_controller_1.updateAtendimentoUraId(atendimento.id, acharIdUra.id, getIdGrupoUra[0][0].grupo_id);
                    atendimento.grupo_id = getIdGrupoUra[0][0].grupo_id;
                }
                else {
                    msgUra = '';
                    msgUra = "Por favor informar uma(s) da(s) opção(ões) a baixo. \\nPara voltar ao início digite a palavra *inicio*.";
                    // console.log('subGrupoUraId.id: ',subGrupoUraId.id);
                    // let rememberUra = await dadosUra[0].filter(x => x.sub_grupo_id == atendimento.ura_id);
                    let rememberUra = yield dadosUra[0].filter(x => x.sub_grupo_id == subGrupoUraId.id);
                    for (let index = 0; index < rememberUra.length; index++) {
                        const element = rememberUra[index];
                        msgUra = msgUra + "\\n" + element.funcao + " = " + element.descricao;
                    }
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," ' + msgUra + '" );');
                    for (let index = 0; index < mensagem.messages.length; index++) {
                        const msg = mensagem.messages[index];
                        yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msgUra, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                    }
                    // console.log('informar uma das opcões acima');
                    return;
                }
            }
            else {
                //exibir inicio da ura de novo                
                msgUra = "";
                let existUraDados = yield dadosUra[0].filter(x => (x.sub_grupo_id == '' || x.sub_grupo_id == null) && (mensagem.messages[0].message ? mensagem.messages[0].message.trim() : mensagem.messages[0].message) != x.funcao);
                if (existUraDados[0]) {
                    if (atendimento.notRepeteMsgUraBegin) {
                        yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","Por favor informar uma das opções abaixo.");');
                    }
                    else {
                        if (remetente.config.enviar_saudacao_cliente == 'True') {
                            // await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + getPeriodoDia() + '! ' + remetente.config.msg_boot_nivel1_pergunta.replace('{cliente}', atendimento.nome) +' '+ remetente.config.msg_boot_nivel2_pergunta+'");');
                            yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + funcs_1.getPeriodoDia() + '! ' + remetente.config.msg_boot_nivel1_pergunta.replace('{cliente}', atendimento.nome) + '");');
                        }
                        for (let index = 0; index < mensagem.messages.length; index++) {
                            const msg = mensagem.messages[index];
                            yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel1_pergunta.replace('{cliente}', atendimento.nome), msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                        }
                        if (remetente.config.permitir_protocolo == 'True')
                            yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","O número de protocolo do seu atendimento é: ' + atendimento.protocolo + '");');
                        for (let index = 0; index < mensagem.messages.length; index++) {
                            const msg = mensagem.messages[index];
                            yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', "O número de protocolo do seu atendimento é: " + atendimento.protocolo, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                        }
                    }
                    for (let index = 0; index < existUraDados.length; index++) {
                        const element = existUraDados[index];
                        msgUra = msgUra + "\\n" + element.funcao + " = " + element.descricao;
                    }
                    yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + msgUra + '" );');
                    for (let index = 0; index < mensagem.messages.length; index++) {
                        const msg = mensagem.messages[index];
                        yield mensagem_service_1.gravaMensagem(atendimento, 'AGENTE', msgUra, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', 'null');
                    }
                    atendimento.grupo_id = null;
                    atendimento.notRepeteMsgUraBegin = true;
                    return;
                }
            }
        }
    }
    else {
        console.log('*************************** SEM URA');
        // atendimento.grupo_id = remetente.grupo_id
        console.log('grupo_id em remetente: ' + remetente.grupo_id);
        console.log('grupo_id em atendimento: ' + atendimento.grupo_id);
        let quotedMessage = 'null';
        for (let index = 0; index < mensagem.messages.length; index++) {
            const msg = mensagem.messages[index];
            if (msg.quotedMessage) {
                if (msg.quotedMessage.type == 'chat') {
                    let fromId = msg.quotedMessage.fromId.split("@");
                    quotedMessage = msg.quotedMessage.message + '$$$$' + fromId[0];
                }
            }
            if (msg.type == 'chat') {
                yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message.trim(), msg.id, 0, null, '', '', '', 'False', 'False', 'texto', quotedMessage);
            }
            else {
                yield mensagem_service_1.gravaMensagem(atendimento, 'CLIENTE', msg.message, msg.id, 0, null, '', '', '', 'False', 'False', 'texto', quotedMessage);
            }
        }
    }
    atendimento.ultimaInteracao = new Date().getTime();
    for (let index = 0; index < mensagem.messages.length; index++) {
        const msg = mensagem.messages[index];
        if (msg.type == 'chat') {
            if (msg.message.trim().toUpperCase() == remetente.config.funcao_encerrar_atendimento.toUpperCase()) {
                yield atendimento_controller_1.finalizaAtendimento(atendimento, true);
                yield remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '"," Atendimento Finalizado com sucesso!" );');
                return;
                // atendimento.nivel = 0;
            }
        }
    }
    yield iniciaAtendimentoWA_1.iniciaAtendimentoWA(atendimento);
    // switch (atendimento.nivel) {
    //     case 0:
    //         atendimento.nivel = 1;            
    //         if (remetente.config.cpf_obrigatorio == 0) {
    //             // console.log('iniciando o atm wa')
    //             await iniciaAtendimentoWA(atendimento);
    //         }
    //         break;
    //     case 1: //valida cpf
    //         if (valida_cpf_cnpj(mensagem.messages[0].message.trim())) {
    //             atendimento.cpf = get_cpfcnpj(mensagem.messages[0].message.trim());
    //             await gravaMensagem(atendimento, 'CLIENTE', mensagem.messages[0].message.trim(), mensagem.messages[0].id, 0, null,'', '', '', 'False', 'False','texto');
    //             await iniciaAtendimentoWA(atendimento);
    //         } else {
    //             await remetente.page.evaluate('sendMessageToId("' + atendimento.chave + '","' + remetente.config.msg_boot_nivel2_resposta + '");');
    //             await gravaMensagem(atendimento, 'AGENTE', remetente.config.msg_boot_nivel2_resposta, mensagem.messages[0].id, 0, null,'', '', '', 'False', 'False','texto');
    //             await remetente.page.evaluate("getLocalUnreadMessagesFromContactIdJson('" + atendimento.chave + "');");
    //         }
    //         break;
    //     default:
    //         break;
    // }
});
//# sourceMappingURL=tratarPreAtendimento.js.map