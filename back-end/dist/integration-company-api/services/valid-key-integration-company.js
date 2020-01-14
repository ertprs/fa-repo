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
exports.validKeyIntegrationCompany = (keyIntegration) => __awaiter(void 0, void 0, void 0, function* () {
    let key = yield conexao_1.database.query("select chave from tb_empresa_chave_integracao where chave = '" + keyIntegration + "' ");
    console.log('keyIntegration ', keyIntegration);
    console.log('key ', key[0][0].chave);
    if (key[0][0].chave == keyIntegration) {
        return true;
    }
    else {
        return false;
    }
});
//# sourceMappingURL=valid-key-integration-company.js.map