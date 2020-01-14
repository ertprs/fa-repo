import { getAtendimentoById, delAtendimento } from './../models/atendimento-model';

export const finalizarAtmClientWeb = async (atendimento_id: number, message) =>
{
    console.log(atendimento_id);
    let atendimento = await getAtendimentoById(atendimento_id);
    await delAtendimento(atendimento);
}
