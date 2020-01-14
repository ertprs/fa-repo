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
const listTroncoEnvioApi = [];
exports.getListTroncoEnvioApiByTroncoId = (tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    return listTroncoEnvioApi.find(x => x.tronco_id == tronco_id);
});
exports.addListTroncoEnvioApi = (listTroncoEnvio) => __awaiter(void 0, void 0, void 0, function* () {
    listTroncoEnvioApi.push({
        tronco_id: listTroncoEnvio.tronco_id,
        empresa_id: listTroncoEnvio.empresa_id,
        trunk: listTroncoEnvio.trunk,
        destiny: listTroncoEnvio.destiny
    });
});
exports.delListTroncoEnvioApi = (tronco_id, destiny) => __awaiter(void 0, void 0, void 0, function* () {
    for (let index = 0; index < listTroncoEnvioApi.length; index++) {
        const listTronco = listTroncoEnvioApi[index];
        if (listTronco.tronco_id == tronco_id) {
            listTroncoEnvioApi.splice(index, 1);
        }
    }
});
//# sourceMappingURL=list-tronco-envio-api-models.js.map