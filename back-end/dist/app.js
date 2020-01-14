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
const inicializacao_1 = require("./inicializacao");
const logs_1 = require("./globais/logs");
const io_1 = require("./libs/io");
const readline_1 = require("./libs/readline"); // ISTEMA DE COMANDOS NO PROPRIO CONSOLE LOG
const agente_model_1 = require("./models/agente-model");
const io_2 = require("./libs/io");
const transferir_grupo_estorno_1 = require("./whatsapp/transferir-grupo-estorno");
const status_tronco_1 = require("./whatsapp/status-tronco");
const analise_atendimentos_1 = require("./controllers/analise-atendimentos");
const fns_AdmDashBoard_1 = require("./controllers/fns-AdmDashBoard");
const charts_model_1 = require("./models/charts-model");
process.on('uncaughtException', (error) => {
    logs_1.LogErro('Erro não tratado:\n', error);
});
process.on('unhandledRejection', (error) => {
    logs_1.LogErro('Rejeição não tratada:\n', error);
});
readline_1.rl; // ISTEMA DE COMANDOS NO PROPRIO CONSOLE LOG
io_1.app;
const funcEstatisticasAgentes = () => {
    fns_AdmDashBoard_1.sendDashBoardAgentes() // CORRIGIDO
        .then(() => {
        setTimeout(() => {
            funcEstatisticasAgentes();
        }, 2000);
    })
        .catch(() => {
        setTimeout(() => {
            funcEstatisticasAgentes();
        }, 2000);
    });
};
const funcEstatisticasGraficos = () => {
    fns_AdmDashBoard_1.sendDashBoardCards() // GERAR OS CARDS
        .then(() => {
        setTimeout(() => {
            funcEstatisticasGraficos();
        }, 2000);
    })
        .catch(() => {
        setTimeout(() => {
            funcEstatisticasGraficos();
        }, 2000);
    });
};
const setGrupoEstorno = () => __awaiter(void 0, void 0, void 0, function* () {
    transferir_grupo_estorno_1.transferirGrupoEstorno()
        .then(() => {
        setTimeout(() => {
            setGrupoEstorno();
        }, 60000);
    })
        .catch(() => {
        setTimeout(() => {
            setGrupoEstorno();
        }, 60000);
    });
});
const StartAnaliseAtendimentos = () => __awaiter(void 0, void 0, void 0, function* () {
    analise_atendimentos_1.AnaliseAtendimentosPendentes()
        .then(() => {
        setTimeout(() => {
            StartAnaliseAtendimentos();
        }, 60000);
    })
        .catch(() => {
        setTimeout(() => {
            StartAnaliseAtendimentos();
        }, 60000);
    });
});
const statusTroncos = () => {
    status_tronco_1.statusTronco()
        .then(() => {
        setTimeout(() => {
            statusTroncos();
        }, 10000);
    })
        .catch(() => {
        setTimeout(() => {
            statusTroncos();
        }, 10000);
    });
};
const ClearStats = () => {
    charts_model_1.acClearCardsCharts()
        .then(() => {
        setTimeout(() => {
            ClearStats();
        }, 40000);
    })
        .catch(() => {
        setTimeout(() => {
            ClearStats();
        }, 40000);
    });
};
const iniciarAgentes = () => __awaiter(void 0, void 0, void 0, function* () {
    let agentes = yield agente_model_1.getAgentes();
    for (let index = 0; index < agentes.length; index++) {
        const agente = agentes[index];
        io_2.io.emit('deslogar', agente.grupo_id);
        console.log('Desconectando agente!');
    }
    return;
});
inicializacao_1.default()
    .then(() => {
    funcEstatisticasGraficos();
    funcEstatisticasAgentes();
    setGrupoEstorno();
    statusTroncos();
    iniciarAgentes();
    charts_model_1.acLoadChartCards(); // Carregar os graficos da tela ADM (PARA EXECUTAR SOMENTE NA INICIALIZAÇÃO)
    ClearStats(); // ZERA STATISTICAS DE TEMPO DOS GRAFICOS A 00:00
    charts_model_1.loadWeekCharts(0);
    setTimeout(() => {
        StartAnaliseAtendimentos();
    }, 5000);
})
    .catch(error => {
    logs_1.LogErro('Erro na inicialização!', error);
});
//# sourceMappingURL=app.js.map