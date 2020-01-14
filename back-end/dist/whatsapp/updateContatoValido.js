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
const conexao_1 = require("./../libs/conexao");
exports.updateContatoValido = (remetente_id, numero, contatoValido) => __awaiter(void 0, void 0, void 0, function* () {
    yield conexao_1.database.query("update tb_whatsapp_mensagens set verificado = 1, numero_valido = " + (contatoValido ? "1 " : "0 ") +
        " where remetente_id = " + remetente_id + " and destino = '" + numero + "' and verificado = 0 ");
});
//# sourceMappingURL=updateContatoValido.js.map