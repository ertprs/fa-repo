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
const atendimento_model_1 = require("./../models/atendimento-model");
const io_1 = require("./../libs/io");
exports.intervencaoSupervisor = (atendimento_id, socket) => __awaiter(void 0, void 0, void 0, function* () {
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    //dar um select no banco e pegar o id do supervisor do grupo e adicionar ao campo
    let intervencaoSupervisorId = yield conexao_1.database.query("select supervisor_id from tb_grupo where id = " + atendimento.grupo_id);
    // console.log('intervencao_supervisor_id e: '+intervencaoSupervisorId[0][0].supervisor_id)
    atendimento.intervencao_supervisor_id = (intervencaoSupervisorId[0][0] ? intervencaoSupervisorId[0][0].supervisor_id : '');
    yield conexao_1.database.query("update tb_atendimento set intervencao_supervisor_id = '" + atendimento.intervencao_supervisor_id + "', " +
        " liberar_intervencao = 'True' where  id = " + atendimento.id);
    atendimento.liberar_intervencao = 'True';
    //dar um emit avisando que a intervenção foi realizada ok
    // socket.emit('userPaused', JSON.stringify({ success: true }));
});
exports.updateIntervencaoSupervisor = (atendimento_id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('update intervencao: ', atendimento_id);
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    yield conexao_1.database.query("update tb_atendimento set intervencao = 'True' where id = " + atendimento_id);
    atendimento.intervencao = 'True';
});
exports.encerrarIntervencaoSupervisor = (atendimento_id, socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('encerrar intervencao: ', atendimento_id);
    let atendimento = yield atendimento_model_1.getAtendimentoById(atendimento_id);
    if (atendimento) {
        yield conexao_1.database.query("update tb_atendimento set intervencao = 'False', liberar_intervencao = 'False' where id = " + atendimento_id);
        // if (atendimento.intervencao == undefined || atendimento.intervencao == 'True')
        atendimento.intervencao = 'False';
        // (atendimento.intervencao == 'False' ? atendimento.intervencao = 'False' : atendimento.intervencao = 'False');
        console.log('intervencao ', atendimento.intervencao);
        atendimento.liberar_intervencao = 'False';
        // socket.emit('encerrarIntervencaoResp', JSON.stringify({ atendimento_id: atendimento_id }));
        // socket.emit('encerrarIntervencaoResp', atendimento_id);
        // io.emit('encerrarIntervencaoResp', atendimento_id);
        yield terminarIntervencaoSupervisor(atendimento_id);
    }
});
function terminarIntervencaoSupervisor(atendimento_id) {
    io_1.io.emit('encerrarIntervencaoResp', atendimento_id);
}
//# sourceMappingURL=intervencaoSupervisor.js.map