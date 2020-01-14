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
const conexao_1 = require("./../libs/conexao");
const io_1 = require("./../libs/io");
exports.statusTronco = () => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('entrei no status do tronco');
    let empresas = [];
    let troncos = yield remetente_model_1.getRemetentes();
    for (let index = 0; index < troncos.length; index++) {
        const tronco = troncos[index];
        let empresa = empresas.find(x => x.empresa_id == tronco.empresa_id);
        if (!empresa) {
            empresa = {
                empresa_id: tronco.empresa_id,
                troncos: []
            };
        }
        empresas.push(empresa);
    }
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let dadosTroncos = yield conexao_1.database.query("select id, descricao, status, batterylevel, remetente, whatsapp_fixo_movel, empresa_id " +
            " from tb_remetente where status <> 'DESATIVADO' and tipo = 'WHATSAPP' and empresa_id = " + empresa.empresa_id);
        if (dadosTroncos[0]) {
            io_1.io.emit('troncoStatus', empresa.empresa_id, JSON.parse(JSON.stringify(dadosTroncos[0])));
        }
    }
});
//# sourceMappingURL=status-tronco.js.map