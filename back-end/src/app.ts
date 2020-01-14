import * as dataTempo from 'node-datetime';
import inicializacao from './inicializacao';
import { LogErro } from './globais/logs';
import { app } from './libs/io';
import { rl } from './libs/readline'; // ISTEMA DE COMANDOS NO PROPRIO CONSOLE LOG
import { getAgentes } from './models/agente-model';
import { io } from './libs/io';
import { transferirGrupoEstorno } from './whatsapp/transferir-grupo-estorno';
import { statusTronco } from './whatsapp/status-tronco';
import { AnaliseAtendimentosPendentes } from './controllers/analise-atendimentos';
import { execSQL } from './globais/dbconn';
import { sendDashBoardAgentes, sendDashBoardCards } from './controllers/fns-AdmDashBoard';
import { acLoadChartCards, acClearCardsCharts, loadWeekCharts} from './models/charts-model';

process.on('uncaughtException', (error) => {
    LogErro('Erro não tratado:\n', error);
});

process.on('unhandledRejection', (error) => {
    LogErro('Rejeição não tratada:\n', error);
});

rl; // ISTEMA DE COMANDOS NO PROPRIO CONSOLE LOG
app;

const funcEstatisticasAgentes = () => {    
    sendDashBoardAgentes() // CORRIGIDO
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
}

const funcEstatisticasGraficos = () => {
    sendDashBoardCards() // GERAR OS CARDS
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
}

const setGrupoEstorno = async() => {
    transferirGrupoEstorno()
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
}

const StartAnaliseAtendimentos = async() => {
    AnaliseAtendimentosPendentes()
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
}

const statusTroncos = () => {
    statusTronco()
    .then(() =>{
        setTimeout(() => {
            statusTroncos();
        }, 10000);
    })
    .catch(() => {
        setTimeout(() => {
            statusTroncos();
        }, 10000);
    })
}

const ClearStats = () => {
    acClearCardsCharts()
    .then(() =>{
        setTimeout(() => {
            ClearStats();
        }, 40000);
    })
    .catch(() => {
        setTimeout(() => {
            ClearStats();
        }, 40000);
    })
}


const iniciarAgentes = async() => {
    let agentes = await getAgentes();
    for (let index = 0; index < agentes.length; index++) {
        const agente = agentes[index];
        io.emit('deslogar', agente.grupo_id);
        console.log('Desconectando agente!');
    }

    return;
} 

inicializacao()
    .then(() => {
        funcEstatisticasGraficos();
        funcEstatisticasAgentes();
        setGrupoEstorno();
        statusTroncos();
        iniciarAgentes();
        acLoadChartCards(); // Carregar os graficos da tela ADM (PARA EXECUTAR SOMENTE NA INICIALIZAÇÃO)
        ClearStats(); // ZERA STATISTICAS DE TEMPO DOS GRAFICOS A 00:00
        
        loadWeekCharts(0);
        
        setTimeout(() => {
            StartAnaliseAtendimentos();    
        }, 5000);
    })
    .catch(error => {
        LogErro('Erro na inicialização!', error);
    });