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
const conexao_1 = require("./../../libs/conexao");
const dataTempo = require("node-datetime");
exports.insertRegistreDatabaseApiIntegration = (parametros) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('parametros database insert: ', parametros); //
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    let montaBase64 = 'data:';
    montaBase64 = montaBase64 + (parametros.type_message == 'documento' ? (parametros.type_file == 'txt' ? 'text/plain' : 'application/') : 'image/');
    montaBase64 = montaBase64 + (parametros.type_file == 'txt' ? '' :
        (parametros.type_file == 'xlsx' ? 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            (parametros.type_file == 'docx' ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' :
                (parametros.type_file == 'jpg' ? 'jpeg' : parametros.type_file))));
    montaBase64 = montaBase64 + ';base64,' + parametros.message;
    let message = (parametros.type_message == 'texto' ? parametros.message : montaBase64);
    yield conexao_1.database.query("insert into tb_mensagem_api_integracao_empresa (empresa_id, tronco_id, destiny, trunk, key_integration, message, " +
        " type_message, type_file, datahora_creat_at) values (" + parametros.empresa_id + ", " + parametros.tronco_id + "," + "'" + parametros.destiny + "', " +
        " '" + parametros.trunk + "', '" + parametros.key_integration + "', '" + message + "', '" + parametros.type_message + "', " +
        " '" + (parametros.type_file ? parametros.type_file : null) + "', '" + data + "' )");
    //return
});
//# sourceMappingURL=insert-registre-database-api-integration.js.map