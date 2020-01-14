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
const dataTempo = require("node-datetime");
const logs_1 = require("./../globais/logs");
//tb_chamadas_perdidas
exports.chamadasPerdidas = (mensagem, tronco) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('chamadas perdidas: ',mensagem);
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    yield conexao_1.database.query("insert into tb_chamadas_perdidas (tronco_id, tronco, tronco_number, datahora_chamada, origem, nome_origem, img_origem, chat_id, empresa_id) values (" +
        tronco.id + ", '" + tronco.descricao + "', '" + tronco.remetente + "', '" + data + "', '" + mensagem.number + "', " +
        " '" + (mensagem.profileName ? mensagem.profileName : mensagem.name) + "', '" + mensagem.avatarUrl + "', '" + mensagem.chatId + "', " + tronco.empresa_id + ");");
    logs_1.Log('Chamada Perdida | Remetente: ' + tronco.descricao + ' | Origem: ' + (mensagem.profileName ? mensagem.profileName : mensagem.name) + ' (' + mensagem.number + ')');
});
//# sourceMappingURL=chamadas-perdidas.js.map