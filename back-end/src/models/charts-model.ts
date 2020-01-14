import * as dataTempo from "node-datetime";
import { execSQL } from "../globais/dbconn";
import { getRemetentes } from "./remetente-model";
import { acGroupBy } from "../globais/funcs";
import { Log } from "../globais/logs";

var SecToTime = function (sec) {
    let hrs = Math.floor(sec / 3600);
    let min = Math.floor((sec - hrs * 3600) / 60);
    let seconds = sec - hrs * 3600 - min * 60;
    seconds = Math.round(seconds * 100) / 100;

    let result = hrs < 10 ? "0" + hrs : hrs;
    result += ":" + (min < 10 ? "0" + min : min);
    result += ":" + (seconds < 10 ? "0" + seconds : seconds);
    return result;
};

export interface weekChart {
    empresa_id: number;
    serie: {};
}

export interface Cards {
    empresa_id: number;
    data: string;
    TMatendimento: string;
    TMfila: string;
    TMUra: string;
    TAtendimento: number;
    TFila: number;
    TUra: number;
    atendidos: number;
    abandonados: number;
}

const cards: Cards[] = [];
const weekCharts: weekChart[] = [];

/*  WEEK CHART FUNCTIONS */

export const delWeekChart = async (empresa_id) => {
    // INFORMAR "0" CASO DESEJE APAGAR TODOS
    for (let index = 0; index < weekCharts.length; index++) {
        const weekChart = weekCharts[index];
        if (weekChart.empresa_id == empresa_id || empresa_id == 0) {
            weekCharts.splice(index, 1);
        }
    }
};

export const getWeekChartSerie = async (empresa_id) => {
    
    let result = weekCharts.find(x => x.empresa_id == empresa_id);
    return result.serie;
};

export const loadWeekCharts = async (empresa_id) => {

    await delWeekChart(empresa_id);
    
    let empresas = [];

    if (empresa_id == 0) {
        let remetentes = await getRemetentes();
        empresas = await acGroupBy("empresa_id", remetentes);
    } else {
        empresas = [{empresa_id:empresa_id}]
    }

    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        

        let dadosAtendimentos: any = await execSQL(
            "        SELECT" +
            "        date(datahora_inicio) as data," +
            "        count(CASE WHEN datahora_atendimento is not null THEN 1 END) AS atendimentos," +
            "        count(CASE WHEN datahora_atendimento is null THEN 1 END) AS abandonadas" +
            "   FROM" +
            "       tb_atendimento " +
            "   WHERE" +
            "    date(datahora_inicio) BETWEEN date(DATE_ADD(now(),INTERVAL -8 DAY)) and  date(DATE_ADD(now(),INTERVAL -1 DAY))" +
            "    and empresa_id = " +
            empresa.empresa_id +
            "    and datahora_fim is not null" +
            "   GROUP BY date(datahora_inicio)"
        );
        if (!dadosAtendimentos) return false;
        let categorias = [];
        let atendidas = {
            name: "Atendidas",
            color: "#35A541",
            data: []
        };
        let abandonadas = {
            name: "Abandonadas",
            color: "#DB6623",
            data: []
        };

        for (let index = 0; index < dadosAtendimentos.length; index++) {
            const element = dadosAtendimentos[index];
            let dt = dataTempo.create(element.data);
            categorias.push(dt.format("d/m/Y"));
        }
        for (let index = 0; index < dadosAtendimentos.length; index++) {
            const element = dadosAtendimentos[index];
            atendidas.data.push(element.atendimentos);
        }

        for (let index = 0; index < dadosAtendimentos.length; index++) {
            const element = dadosAtendimentos[index];
            abandonadas.data.push(element.abandonadas);
        }

        let serie = {
            empresa_id: empresa.empresa_id,
            serie: { series: [atendidas, abandonadas], categorias: categorias }
        }; 
        
        weekCharts.push(serie);
    }

    console.log(JSON.stringify(weekCharts));
};

/* ----------------------*/

export const acDelCard = async empresa_id => {
    // INFORMAR "0" CASO DESEJE APAGAR TODOS
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == empresa_id || empresa_id == 0) {
            cards.splice(index, 1);
        }
    }
};

export const acLoadChartCards = async () => {
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    let remetentes = await getRemetentes();
    let empresas = await acGroupBy("empresa_id", remetentes);
    await acDelCard(0);

    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];

        let sValues = await execSQL(
            "select " +
            "	COUNT(id) as qtd, " +
            "	IFNULL(SUM(if(atm.datahora_atendimento is null,1,0)),0) as abandonadas, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_atendimento , ifnull(atm.datahora_fim,now()))),0) as TAtendimento, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_fila, ifnull(atm.datahora_atendimento,now()))),0) as TFila, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_inicio, ifnull(atm.datahora_fila,now()))),0) as TUra	" +
            "from tb_atendimento as atm " +
            "where date(atm.datahora_inicio) = date(now()) and atm.datahora_fim IS NOT NULL " +
            "and empresa_id = '" +
            empresa.empresa_id +
            "'"
        );

        //isNaN

        if (sValues[0]) {
            let sTMA = isNaN(Math.floor(sValues[0].TAtendimento / sValues[0].qtd))
                ? 0
                : Math.floor(sValues[0].TAtendimento / sValues[0].qtd);
            let sTMF = isNaN(Math.floor(sValues[0].TFila / sValues[0].qtd))
                ? 0
                : Math.floor(sValues[0].TFila / sValues[0].qtd);
            let sTMU = isNaN(Math.floor(sValues[0].TUra / sValues[0].qtd))
                ? 0
                : Math.floor(sValues[0].TUra / sValues[0].qtd);
            // console.log(sTMA);

            let card = {
                empresa_id: empresa.empresa_id,
                data: data,
                TMatendimento: SecToTime(sTMA).toString(),
                TMfila: SecToTime(sTMF).toString(),
                TMUra: SecToTime(sTMU).toString(),
                TAtendimento: parseInt(sValues[0].TAtendimento),
                TFila: parseInt(sValues[0].TFila),
                TUra: parseInt(sValues[0].TUra),
                atendidos: parseInt(sValues[0].qtd),
                abandonados: parseInt(sValues[0].abandonadas)
            };
            cards.push(card);
        }
    }
    //    console.log(cards);
};

export const acAddNewCard = async empresa_id => {
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    let card = {
        empresa_id: empresa_id,
        data: data,
        TMatendimento: "00:00:00",
        TMfila: "00:00:00",
        TMUra: "00:00:00",
        TAtendimento: 0,
        TFila: 0,
        TUra: 0,
        atendidos: 0,
        abandonados: 0
    };
    cards.push(card);
};

export const acUpdateCard = async (
    empresa_id,
    TAtendimento,
    TFila,
    TUra,
    atendidos,
    abandonados
) => {
    let dt = dataTempo.create();
    let data = dt.format("Ymd");

    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == empresa_id) {
            if (card.data != data) {
                await acDelCard(empresa_id);
                await acAddNewCard(empresa_id);
                acUpdateCard(
                    empresa_id,
                    TAtendimento,
                    TFila,
                    TUra,
                    atendidos,
                    abandonados
                );
                return;
            }

            if (typeof TAtendimento === "number") {
                card.TAtendimento = TAtendimento;
            }
            if (typeof TFila === "number") {
                card.TFila = TFila;
            }
            if (typeof TUra === "number") {
                card.TUra = TUra;
            }
            if (typeof atendidos === "number") {
                card.atendidos = atendidos;
            }
            if (typeof abandonados === "number") {
                card.abandonados = abandonados;
            }

            let sTMA = Math.floor(card.TAtendimento / card.atendidos);
            let sTMF = Math.floor(card.TFila / card.atendidos);
            let sTMU = Math.floor(card.TUra / card.atendidos);
            card.TMatendimento = SecToTime(sTMA).toString();
            card.TMfila = SecToTime(sTMF).toString();
            card.TMUra = SecToTime(sTMU).toString();
        }
    }
};

export const acGetCardByEmpresaID = async empresa_id => {
    return cards.find(x => x.empresa_id == empresa_id);
};

export const acGenChartCard = async atendimento => {
    let dt = dataTempo.create();
    let data = dt.format("Y-m-d H:M:S");

    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == atendimento.empresa_id) {
            if (
                atendimento.datahora_inicio &&
                atendimento.datahora_fila &&
                atendimento.datahora_atendimento
            ) {
                let retorno = await execSQL(
                    "SELECT " +
                    "TIMESTAMPDIFF(SECOND,'" +
                    atendimento.datahora_inicio +
                    "','" +
                    atendimento.datahora_fila +
                    "') as wait_ura, " +
                    "TIMESTAMPDIFF(SECOND,'" +
                    atendimento.datahora_fila +
                    "','" +
                    atendimento.datahora_atendimento +
                    "') as wait_fila, " +
                    "TIMESTAMPDIFF(SECOND,'" +
                    atendimento.datahora_atendimento +
                    "','" +
                    data +
                    "') as wait_atendimento"
                );

                let sAtendidos = Math.floor(card.atendidos + 1);
                let sTAtendimento = Math.floor(
                    card.TAtendimento + retorno[0].wait_atendimento
                );
                let sTFila = Math.floor(card.TFila + retorno[0].wait_fila);
                let sTUra = Math.floor(card.TUra + retorno[0].wait_ura);

                acUpdateCard(
                    card.empresa_id,
                    sTAtendimento,
                    sTFila,
                    sTUra,
                    sAtendidos,
                    false
                );
            } else {
                let sAbandonados = Math.floor(card.abandonados + 1);
                acUpdateCard(card.empresa_id, false, false, false, false, sAbandonados);
            }
            return;
        }
    }
};

export const acClearCardsCharts = async () => {
    let dt = dataTempo.create();
    let data = dt.format("H:M");

    if (data == "00:00") {
        let remetentes = await getRemetentes();
        let empresas = await acGroupBy("empresa_id", remetentes);
        await acDelCard(0);

        for (let index = 0; index < empresas.length; index++) {
            const empresa = empresas[index];
            await acAddNewCard(empresa.empresa_id);
        }
        loadWeekCharts(0);
    }
};
