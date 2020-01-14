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
const valid_key_integration_company_1 = require("./valid-key-integration-company");
const replace_message_1 = require("./replace-message");
const insert_registre_database_api_integration_1 = require("./insert-registre-database-api-integration");
const list_tronco_envio_api_models_1 = require("./../models/list-tronco-envio-api-models");
const remetente_model_1 = require("./../../models/remetente-model");
exports.sendMessageToApi = (parametros) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('##### Disparo via API - Tronco: ' + parametros.trunk);
    // console.log('parametros: ',parametros);
    // let tronco = await getRemetenteByMyNumber(parametros.trunk); 
    let tronco = yield remetente_model_1.getRemetenteById(parametros.trunk);
    if (!tronco) {
        return {
            statusCode: 404,
            status: false,
            msg: 'Tronco não encontrado no sistema!',
            data: []
        };
    }
    let chaveIntegration = yield valid_key_integration_company_1.validKeyIntegrationCompany(parametros.key_integration);
    if (!chaveIntegration) {
        return {
            statusCode: 404,
            status: false,
            msg: 'Chave de integração não encontrado no sistema!',
            data: []
        };
    }
    if (!parametros.type_message) {
        return {
            statusCode: 404,
            status: false,
            msg: 'Não existe o tipo da mensagem!',
            data: []
        };
    }
    // ## checar se destino está em atendimento ##
    // ## checar tronco qtd envios ##
    // let exEnvioTronco = await getListTroncoEnvioApiByTroncoId(tronco.id);
    // console.log('exEnvioTronco: ',exEnvioTronco);
    let message = "";
    if (parametros.type_message == 'texto') {
        message = yield replace_message_1.replaceMessage(parametros.message);
        yield tronco.page.evaluate('sendMessageToNumber("' + parametros.destiny + '","' + message + '");');
    }
    else {
        let montaBase64 = 'data:';
        montaBase64 = montaBase64 + (parametros.type_message == 'documento' ? (parametros.type_file == 'txt' ? 'text/plain' : 'application/') : 'image/');
        montaBase64 = montaBase64 + (parametros.type_file == 'txt' ? '' :
            (parametros.type_file == 'xlsx' ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                (parametros.type_file == 'docx' ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' :
                    (parametros.type_file == 'jpg' ? 'jpeg' : parametros.type_file))));
        montaBase64 = montaBase64 + ';base64,';
        // let base64file = montaBase64+parametros.message;
        let base64file = parametros.message;
        if (parametros.type_message == 'imagem') {
            yield tronco.page.evaluate('sendBase64MediaToNumber("' + parametros.destiny + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + parametros.trunk + '", "image/' + parametros.type_file + '", "");');
        }
        else if (parametros.type_message == 'documento') {
            yield tronco.page.evaluate('sendBase64MediaToNumber("' + parametros.destiny + '","' + base64file.replace(/(?:\r\n|\r|\n)/g, '') + '", "' + parametros.trunk + '.' + parametros.type_file + '", "", "");');
        }
        else {
            return {
                statusCode: 404,
                status: false,
                msg: 'Esse tipo de documento não pode ser enviado!',
                data: []
            };
        }
    }
    let paramsListTronco = {
        empresa_id: tronco.empresa_id,
        tronco_id: tronco.id,
        trunk: tronco.mynumber,
        destiny: parametros.destiny
    };
    yield list_tronco_envio_api_models_1.addListTroncoEnvioApi(paramsListTronco);
    let params = {
        empresa_id: tronco.empresa_id,
        tronco_id: tronco.id,
        destiny: parametros.destiny,
        trunk: tronco.mynumber,
        key_integration: parametros.key_integration,
        message: parametros.message,
        type_message: parametros.type_message,
        type_file: parametros.type_file
    };
    yield insert_registre_database_api_integration_1.insertRegistreDatabaseApiIntegration(params);
    return {
        statusCode: 201,
        status: true,
        msg: 'Mensagem enviada com sucesso!',
        data: []
    };
});
//# sourceMappingURL=send-to-message-api.js.map