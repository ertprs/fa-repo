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
const dataTempo = require("node-datetime");
const dbconn_1 = require("../globais/dbconn");
const remetente_model_1 = require("./remetente-model");
const funcs_1 = require("../globais/funcs");
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
const cards = [];
const weekCharts = [];
/*  WEEK CHART FUNCTIONS */
exports.delWeekChart = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    // INFORMAR "0" CASO DESEJE APAGAR TODOS
    for (let index = 0; index < weekCharts.length; index++) {
        const weekChart = weekCharts[index];
        if (weekChart.empresa_id == empresa_id || empresa_id == 0) {
            weekCharts.splice(index, 1);
        }
    }
});
exports.getWeekChartSerie = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    let result = weekCharts.find(x => x.empresa_id == empresa_id);
    return result.serie;
});
exports.loadWeekCharts = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.delWeekChart(empresa_id);
    let empresas = [];
    if (empresa_id == 0) {
        let remetentes = yield remetente_model_1.getRemetentes();
        empresas = yield funcs_1.acGroupBy("empresa_id", remetentes);
    }
    else {
        empresas = [{ empresa_id: empresa_id }];
    }
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let dadosAtendimentos = yield dbconn_1.execSQL("        SELECT" +
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
            "   GROUP BY date(datahora_inicio)");
        if (!dadosAtendimentos)
            return false;
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
});
/* ----------------------*/
exports.acDelCard = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    // INFORMAR "0" CASO DESEJE APAGAR TODOS
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == empresa_id || empresa_id == 0) {
            cards.splice(index, 1);
        }
    }
});
exports.acLoadChartCards = () => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    let remetentes = yield remetente_model_1.getRemetentes();
    let empresas = yield funcs_1.acGroupBy("empresa_id", remetentes);
    yield exports.acDelCard(0);
    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        let sValues = yield dbconn_1.execSQL("select " +
            "	COUNT(id) as qtd, " +
            "	IFNULL(SUM(if(atm.datahora_atendimento is null,1,0)),0) as abandonadas, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_atendimento , ifnull(atm.datahora_fim,now()))),0) as TAtendimento, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_fila, ifnull(atm.datahora_atendimento,now()))),0) as TFila, " +
            "	IFNULL(SUM(TIMESTAMPDIFF(SECOND,atm.datahora_inicio, ifnull(atm.datahora_fila,now()))),0) as TUra	" +
            "from tb_atendimento as atm " +
            "where date(atm.datahora_inicio) = date(now()) and atm.datahora_fim IS NOT NULL " +
            "and empresa_id = '" +
            empresa.empresa_id +
            "'");
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
});
exports.acAddNewCard = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.acUpdateCard = (empresa_id, TAtendimento, TFila, TUra, atendidos, abandonados) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format("Ymd");
    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == empresa_id) {
            if (card.data != data) {
                yield exports.acDelCard(empresa_id);
                yield exports.acAddNewCard(empresa_id);
                exports.acUpdateCard(empresa_id, TAtendimento, TFila, TUra, atendidos, abandonados);
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
});
exports.acGetCardByEmpresaID = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    return cards.find(x => x.empresa_id == empresa_id);
});
exports.acGenChartCard = (atendimento) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format("Y-m-d H:M:S");
    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (card.empresa_id == atendimento.empresa_id) {
            if (atendimento.datahora_inicio &&
                atendimento.datahora_fila &&
                atendimento.datahora_atendimento) {
                let retorno = yield dbconn_1.execSQL("SELECT " +
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
                    "') as wait_atendimento");
                let sAtendidos = Math.floor(card.atendidos + 1);
                let sTAtendimento = Math.floor(card.TAtendimento + retorno[0].wait_atendimento);
                let sTFila = Math.floor(card.TFila + retorno[0].wait_fila);
                let sTUra = Math.floor(card.TUra + retorno[0].wait_ura);
                exports.acUpdateCard(card.empresa_id, sTAtendimento, sTFila, sTUra, sAtendidos, false);
            }
            else {
                let sAbandonados = Math.floor(card.abandonados + 1);
                exports.acUpdateCard(card.empresa_id, false, false, false, false, sAbandonados);
            }
            return;
        }
    }
});
exports.acClearCardsCharts = () => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format("H:M");
    if (data == "00:00") {
        let remetentes = yield remetente_model_1.getRemetentes();
        let empresas = yield funcs_1.acGroupBy("empresa_id", remetentes);
        yield exports.acDelCard(0);
        for (let index = 0; index < empresas.length; index++) {
            const empresa = empresas[index];
            yield exports.acAddNewCard(empresa.empresa_id);
        }
        exports.loadWeekCharts(0);
    }
});
//# sourceMappingURL=charts-model.js.map