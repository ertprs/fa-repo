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
exports.listAtendimentosFinalizados = (agente_id, empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('agente id: '+agente_id+', e empresa id: '+empresa_id);
    // let dadosAtmFinalizados: any = await database.query("select a.*, r.descricao, c.nome, c.cpf, c.telefone, c.email, c.whatsapp_url_avatar from tb_atendimento a "+
    // " left join tb_remetente r on r.id = a.remetente_id left join tb_cliente c on c.id = a.cliente_id where a.agente_id = "+agente_id+" and a.empresa_id = "+empresa_id+" "+
    // " and datahora_fim is not null GROUP BY a.cliente_id");
    // if (dadosAtmFinalizados[0][0]) {
    //     // emitindo a lista de array finalizados   987400061 -- albeneir   || 98731-9817 -- fabia show tecnologia  
    //     for (let index = 0; index < dadosAtmFinalizados[0].length; index++) {
    //         const atm = dadosAtmFinalizados[0][index];
    //         io.emit('arrayAtendimentoFinalizados', JSON.stringify({
    //             usuario_id: atm.agente_id,
    //             remetente_id: atm.remetente_id,
    //             tronco: atm.descricao,
    //             cliente_id: atm.cliente_id,
    //             cliente_nome: atm.nome,
    //             cliente_cpf: atm.cpf,
    //             cliente_telefone: atm.telefone,
    //             cliente_email: atm.email,
    //             avatar: atm.whatsapp_url_avatar,
    //             protocolo: atm.protocolo,
    //             atendimento_id: atm.id,
    //             id: atm.id,
    //             datahora_inicio: atm.datahora_inicio,
    //             datahora_fila: atm.datahora_fila,
    //             tipo: atm.tipo,
    //             intervencao: atm.intervencao,
    //             liberar_intervencao: atm.liberar_intervencao,
    //             atm_finalizado: true
    //         }));
    //     }
    // }
});
//# sourceMappingURL=lista-atm-finalizado.js.map