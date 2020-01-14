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
const grupos = [];
exports.getGrupos = () => __awaiter(void 0, void 0, void 0, function* () {
    return grupos;
});
exports.getGrupoById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return grupos.find(x => x.id == id);
});
exports.getGrupoByAgenteId = (agente_id) => __awaiter(void 0, void 0, void 0, function* () {
    return grupos.filter(x => x.agente_id == agente_id);
});
exports.getGrupoByEmpresaId = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return grupos.filter(x => x.empresa_id == empresa_id);
});
exports.addGrupo = (grupo) => __awaiter(void 0, void 0, void 0, function* () {
    grupos.push(grupo);
    logs_1.Log('Grupo "' + grupo.id + '" adicionado na lista!');
});
exports.delGrupo = (agente_id) => __awaiter(void 0, void 0, void 0, function* () {
    for (let index = 0; index < grupos.length; index++) {
        const grupo = grupos[index];
        if (grupo.agente_id == agente_id) {
            grupos.splice(index, 1);
            logs_1.Log('Grupo "' + grupo.id + '" removido na lista!');
        }
    }
});
//# sourceMappingURL=grupo-models.js.map