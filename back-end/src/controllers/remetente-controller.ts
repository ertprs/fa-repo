import * as puppeteer from 'puppeteer';
import * as fs from 'fs'; 
import * as path from 'path';
import * as dataTempo from 'node-datetime';

import {
    Remetente,
    getRemetenteById,
    addRemetente,
    RemetenteTipo,
    getRemetentes,
    getRemetenteByEmpresaId,
    delRemetente
} from './../models/remetente-model';
import { Log, LogErro } from './../globais/logs';
import { CheckEvent } from './../whatsapp/console-service';
import { database } from './../libs/conexao';
import { io } from './../libs/io';
import { getAgentesByEmpresaId } from './../models/agente-model';
import { getAtendimentosNaoAtendidos } from './../models/atendimento-model';
import { checkAgenteDisponivel } from './atendimento-controller';


export const getBrowser = async (remetente: Remetente) => {

    remetente.browser = await puppeteer.launch({
        headless: true,
        args: [
            '--user-data-dir=' + './cache/' + remetente.empresa_id.toString() + '/' + remetente.id.toString(),
            '--no-sandbox',
        ],
        // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    });

    remetente.page = await remetente.browser.newPage();

    await remetente.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    await remetente.page.setViewport({ width: 960, height: 768 });
    await remetente.page.goto('https://web.whatsapp.com');
    await remetente.page.evaluate(fs.readFileSync(path.join(__dirname, '..', 'libs', 'inject.js'), 'utf8'));

    await remetente.page.evaluate('startMonitoring();');
    await remetente.page.evaluate('startQrCodeMonitoring();');

    remetente.page.on('load', function (e) {
        remetente.page.evaluate(fs.readFileSync(path.join(__dirname, '..', 'libs', 'inject.js'), 'utf8'));
    });

    remetente.page.on('console', function (e) {
        try {
            //let remetenteImpusinamento = await database.query("");
            let evento = JSON.parse(e.text());
            CheckEvent(evento,remetente.id);
        }
        catch (e) {
            LogErro('Erro no console! Mensagem inválida (Remetente: ' + remetente.id + ")" + '\n' + 'Texto: ' + e.text(), e);
        }
    });

    remetente.page.on('error', function (e) {
        LogErro('Erro na página! (Remetente: ' + remetente.id + ")", e);
    });

    remetente.browser.on('disconnected', function (e) {
        Log('Fechou Browser! (Remetente: ' + remetente.id + ")");
    });

    remetente.page.on('close', function (e) {
        Log('Pagina Fechou! (Remetente: ' + remetente.id + ")");
    });
}

// #### criar um atulaizar remetente

export const updateRemetente = async (remetente: Remetente, evento) => {

    await remetente.page.evaluate('getStatusJson();');
    await database.query("update tb_remetente set battery = " + (evento.monitoring_phone.battery ? '1' : '0') +
        ", battery_charging = " + (evento.monitoring_phone.battery_charging ? '1' : '0') +
        ", batterylevel = " + (evento.monitoring_phone.battery_charge ? evento.monitoring_phone.battery_charge : '0') +
        ", status = '" + (evento.monitoring_phone.authenticated ? 'CONECTADO' : 'DESCONECTADO') +
        "' , mynumber = " + (evento.monitoring_phone.authenticated ? 'mynumber' : "''") +
        " where id = " + remetente.id);

    // Log('Monitoramento! | Remetente: ' + remetente.id + ' | ' + JSON.stringify(evento.monitoring_phone));
    io.emit('monitoring', JSON.stringify({ success: true, remetente_id: remetente.id }));

    //Atualizando objeto local da empresa(remetente) 
    // console.log('evento monitoring: ', evento.monitoring_phone.authenticated + ' id remetente: ', remetente.id);
    (evento.monitoring_phone.authenticated) ? remetente.status = 'CONECTADO' : remetente.status = 'DESCONECTADO';
    if (!evento.monitoring_phone.authenticated) remetente.mynumber = '';
}



export const getConfig = async (remetente: Remetente) => {
    let config = await database.query("select * from tb_config where empresa_id = " + remetente.empresa_id + " limit 1");

    if (config[0][0]) { 
        remetente.config = config[0][0];
        console.log('setou as configurações da empresa');
        //verificar atendimentos para os agentes
        // let atendientos = await getAtendimentosByEmpresaId(remetente.empresa_id);
        let atendientos = await getAtendimentosNaoAtendidos(remetente.empresa_id);
        for (let index = 0; index < atendientos.length; index++) {
            const atendimento = atendientos[index];
            await checkAgenteDisponivel(atendimento);
        } 
    } else {
        remetente.config = null;
    }

    // remetente.config = config![0]![0] || null;
}

export const reinicializar = async (empresa_id) => {
    let listaRemetentes: any = await database.query("SELECT r.*, gr.grupo_id, g.nome as grupo_nome FROM " +
        "tb_remetente r, tb_grupo_remetente gr, tb_grupo g WHERE g.id = gr.grupo_id and " +
        "r.id = gr.remetente_id AND r.`status` <> 'DESATIVADO' and r.empresa_id = " + empresa_id);
    if (!listaRemetentes![0]) return;

    for (let index = 0; index < listaRemetentes[0].length; index++) {
        const item = listaRemetentes[0][index];
        let remetente = await getRemetenteById(item.id);

        if (remetente) {
            remetente.descricao = item.descricao;
            remetente.remetente = item.remetente;
            remetente.tipo = item.tipo;
            if (remetente.grupo_id != item.grupo_id) {
                io.emit('deslogar', remetente.grupo_id);
            }
            remetente.grupo_id = item.grupo_id;
            remetente.grupo_nome = item.grupo_nome;
        } else {
            remetente = {
                id: item.id,
                empresa_id: item.empresa_id,
                descricao: item.descricao,
                remetente: item.remetente,
                tipo: item.tipo,
                grupo_id: item.grupo_id,
                grupo_nome: item.grupo_nome,
                status: 'DESCONECTADO'
            };
            if (remetente.tipo == RemetenteTipo.WHATSAPP) {
                await getBrowser(remetente);
            }
            await addRemetente(remetente);
        }
        await getConfig(remetente);
    }
}

export const updateConfig = async (empresa_id) => {
    let remetentes = await getRemetenteByEmpresaId(empresa_id);

    for (let index = 0; index < remetentes.length; index++) {
        const remetente = remetentes[index];
        await getConfig(remetente);
    }
}

export const desativar = async (remetente_id) => {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    // console.log('id remetente: ' + remetente_id);
    let remetente = await getRemetenteById(remetente_id);
    // console.log('lista remetente: ' + remetente);
    if (remetente == undefined || remetente == null) {
        console.log('desativando o tronco...');
        // await remetente.page.evaluate('logout();');
        let statusRemetente = await database.query("select status from tb_remetente where id = " + remetente_id);

        if (statusRemetente[0][0] && statusRemetente[0][0].status != 'DESATIVADO') {
            await database.query("update tb_remetente set status = 'DESATIVADO' where id = " + remetente_id);
            await database.query("update tb_atendimento set datahora_fim = '"+ data +"' where remetente_id = " + remetente_id + " and datahora_fim is null");
        } else {
            await database.query("update tb_atendimento set datahora_fim = '"+ data +"' where remetente_id = " + remetente_id + " and datahora_fim is null");
        }
    } else {
        console.log('excluindo tronco whatsapp');
        if (remetente.tipo == RemetenteTipo.WHATSAPP) {
            // await remetente.page.evaluate('logout();');
    
            await remetente.page.close();
            await remetente.browser.close();
        }
        await delRemetente(remetente);
        await database.query("update tb_remetente set status = 'DESATIVADO' where id = " + remetente_id);
        await database.query("update tb_atendimento set datahora_fim = '"+ data +"' where remetente_id = " + remetente_id + " and datahora_fim is null");
    }    
}

export const reniciarTronco = async (tronco_id) => {
    // console.log('id remetente: ' + remetente_id);
    let remetente = await getRemetenteById(tronco_id);
    // console.log('lista remetente: ' + remetente);
    if (remetente == undefined || remetente == null) {
        // await remetente.page.evaluate('logout();');
    } else {
        if (remetente.tipo == RemetenteTipo.WHATSAPP) {
            await remetente.page.evaluate('logout();');
    
            await remetente.page.close();
            await remetente.browser.close();
        }
        await delRemetente(remetente);
    }
}

export const getAtendimentosSemana = async (empresa_id) => {
    let dadosAtendimentos: any = await database.query(
        "        SELECT" +
        "        date(datahora_inicio) as data," +
        "        count(CASE WHEN datahora_atendimento is not null THEN 1 END) AS atendimentos," +
        "        count(CASE WHEN datahora_atendimento is null THEN 1 END) AS abandonadas" +
        "   FROM" +
        "       tb_atendimento " +
        "   WHERE" +
        "    date(datahora_inicio) BETWEEN date(DATE_ADD(now(),INTERVAL -8 DAY)) and  date(DATE_ADD(now(),INTERVAL -1 DAY))" +
        "    and empresa_id = " + empresa_id +
        "    and datahora_fim is not null" +
        "   GROUP BY date(datahora_inicio)");
    if (!dadosAtendimentos![0]) return false;
    let categorias = [];
    let atendidas = {
        name: 'Atendidas',
        color: "#35A541",
        data: []
    };
    let abandonadas = {
        name: 'Abandonadas',
        color: "#DB6623",
        data: []
    };

    for (let index = 0; index < dadosAtendimentos[0].length; index++) {
        const element = dadosAtendimentos[0][index];
        let dt = dataTempo.create(element.data);
        categorias.push(dt.format('d/m/Y'));
    }
    for (let index = 0; index < dadosAtendimentos[0].length; index++) {
        const element = dadosAtendimentos[0][index];
        atendidas.data.push(element.atendimentos);
    }

    for (let index = 0; index < dadosAtendimentos[0].length; index++) {
        const element = dadosAtendimentos[0][index];
        abandonadas.data.push(element.abandonadas);
    }
    return { series: [atendidas, abandonadas], categorias: categorias };
}

export const checkContatos = async (campanha_id) => {
    let dadoCampanha: any = await database.query("select * from tb_whatsapp_mensagens where verificado = 0 and campanha_id = " + campanha_id);
    if (dadoCampanha![0].length == 0) return;

    let remetente = await getRemetenteById(dadoCampanha[0][0].remetente_id);
    if (!remetente) return;
    for (let index = 0; index < dadoCampanha[0].length; index++) {
        const mensagem = dadoCampanha[0][index];
        await remetente.page.evaluate('contactExist("' + mensagem.destino + '");');
    }
}

export const updateRemetenteId = async (remetente_id) => {
    let dadosRemetente = await database.query("select * from tb_remetente where id = " + remetente_id);
    // console.log('dados do remetente update: ',dadosRemetente[0][0].palavra_chave);
    let remetente = await getRemetenteById(remetente_id);

    if (dadosRemetente[0][0]) {
        remetente.status = dadosRemetente[0][0].status;
        remetente.impulsionar = dadosRemetente[0][0].impulsionar;
        remetente.redirect = dadosRemetente[0][0].redirect;
        remetente.palavra_chave = dadosRemetente[0][0].palavra_chave;
    }
}