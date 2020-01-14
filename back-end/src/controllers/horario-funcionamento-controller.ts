import { getHorariosFuncionamentoByTroncoId } from "./../models/horario-funcionamento-model";
import { getDiaSemana, getHoraFuncionamento } from './../services/horario-funcionamento-services';
import { database } from './../libs/conexao';
import { addHorariosFuncionamento, getHorariosFuncionamentoById } from './../models/horario-funcionamento-model';


export const horarioFuncionamento = async (tronco_id: number) => {
    // console.log('tronco id agora: ',tronco_id);
    let diasHorarios = await getHorariosFuncionamentoByTroncoId(tronco_id);
    // console.log('diasHorarios: ',diasHorarios);

    if (diasHorarios) {
        let diaSemana = await getDiaSemana();
        // console.log('diaSemana: ',diaSemana);
        let diaHorario = await diasHorarios.find(x => x.dia_semana == diaSemana);
        // console.log('diaHorario: ',diaHorario);
        if (!diaHorario) return {
            status: true,
            data: []
        }

        if (diaHorario.ativo == 'True') {
            //ver a hora
            let resp: boolean = await getHoraFuncionamento(diaHorario.hora_inicio, diaHorario.hora_fim);
            // console.log('resp: ',resp);
            if (resp) {
                return {
                    status: true,
                    data: []
                }
            } else {
                return {
                    status: false,
                    data: diaHorario
                }
            }
        } else {
            return {
                status: true,
                data: []
            }
        }
    } else {
        return {
            status: true,
            data: []
        }
    }
}

export const insertHorarioFuncionamentoController = async (params) => {
    console.log('params: ', params);
    let horarioFunc = await database.query("select * from tb_horarios_funcionamentos where tronco_id = "+params.tronco_id+" and dia_semana = '"+params.dia_semana+"' ");

    await addHorariosFuncionamento(horarioFunc[0][0]);
}

export const updateHorarioFuncionamentoController = async (params) => {
    console.log('params: ', params);
    let horariosFunc = await getHorariosFuncionamentoById(params.id);

    horariosFunc.hora_inicio = params.hora_inicio;
    horariosFunc.hora_fim = params.hora_fim;
    horariosFunc.mensagem = params.mensagem;
    horariosFunc.ativo = params.ativo;
}