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
const io_1 = require("./../libs/io");
const remetente_model_1 = require("./../models/remetente-model");
exports.qrcodechanged = (evento, remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
    if (remetente) {
        yield remetente.page.evaluate('getStatusJson();');
    }
    yield conexao_1.database.query("update tb_remetente set qrcode = '" + evento.qr_code_url +
        "' where id = " + remetente_id);
    io_1.io.emit('qrcodechanged', JSON.stringify({ success: true, remetente_id: remetente_id }));
});
//# sourceMappingURL=qrcodechanged.js.map