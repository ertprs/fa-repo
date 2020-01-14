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
const logs_1 = require("./../globais/logs");
var RemetenteTipo;
(function (RemetenteTipo) {
    RemetenteTipo["WHATSAPP"] = "Whatsapp";
    RemetenteTipo["WEB"] = "Web";
    RemetenteTipo["FACEBOOK"] = "FACEBOOK";
})(RemetenteTipo = exports.RemetenteTipo || (exports.RemetenteTipo = {}));
const remetentes = [];
exports.getRemetentes = () => __awaiter(void 0, void 0, void 0, function* () {
    return remetentes;
});
exports.getRemetentesFilter = () => __awaiter(void 0, void 0, void 0, function* () {
    return remetentes.map(x => {
        return {
            id: x.id,
            descricao: x.descricao,
            grupo_id: x.grupo_id,
            grupo_nome: x.grupo_nome,
            autenticado: x.autenticado,
            empresa_id: x.empresa_id
        };
    });
});
exports.getRemetenteById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return remetentes.find(x => x.id == id);
});
exports.getFirstRemetenteByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    for (let index = 0; index < remetentes.length; index++) {
        const remetente = remetentes[index];
        if (remetente.empresa_id == empresa_id)
            return remetente;
    }
});
exports.getRemetenteByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return remetentes.filter(x => x.empresa_id == empresa_id);
});
exports.getRemetenteByMyNumber = (mynumber) => __awaiter(void 0, void 0, void 0, function* () {
    return remetentes.find(x => (x.mynumber.length == 13 ? x.mynumber : x.mynumber.substring(0, 4) + '9' + x.mynumber.substring(4))
        ==
            (mynumber.length == 13 ? mynumber : mynumber.substring(0, 4) + '9' + mynumber.substring(4)));
});
exports.addRemetente = (remetente) => __awaiter(void 0, void 0, void 0, function* () {
    remetentes.push(remetente);
    logs_1.Log('Remetente "' + remetente.id + '" adicionado na lista!');
});
exports.delRemetente = (remetente) => __awaiter(void 0, void 0, void 0, function* () {
    let id = remetente.id;
    for (let index = 0; index < remetentes.length; index++) {
        const rem = remetentes[index];
        if (rem.id == id) {
            remetentes.splice(index, 1);
            logs_1.Log('Remetente "' + id + '" removido na lista!');
        }
    }
});
//# sourceMappingURL=remetente-model.js.map