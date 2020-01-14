import { 
    getAtendimentoById, 
    delAtendimento 
} from './../models/atendimento-model';
import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { checkAgenteDisponivel } from './../controllers/atendimento-controller';
import { getRemetenteById } from './../models/remetente-model';

export const liberarAtedimentoPendente = async (atendimento_id: number) => {
    let atendimento = await getAtendimentoById(atendimento_id);
    atendimento.retirar_pendente = true;
    await checkAgenteDisponivel(atendimento);

    Log('Atendimento removido da lista de Pendente "' + atendimento.id);
}

export const finalizarAtendimentoPendente = async (atendimento_id: number) => {
    let atendimento = await getAtendimentoById(atendimento_id);
    let tronco = await getRemetenteById(atendimento.remetente_id)
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');

    await database.query("update tb_atendimento set datahora_fim = '" + data + "', cliente_finalizou = 'False' where id = " + atendimento.id);
    await delAtendimento(atendimento);
    await tronco.page.evaluate('sendMessageToId("' + atendimento.chave + '","Atendimento Finalizado com sucesso!");');

    Log('Atendimento "' + atendimento.id + '" finalizado!');
}