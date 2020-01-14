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
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const dataTempo = require("node-datetime");
const remetente_model_1 = require("./../models/remetente-model");
const logs_1 = require("./../globais/logs");
const console_service_1 = require("./../whatsapp/console-service");
const conexao_1 = require("./../libs/conexao");
const io_1 = require("./../libs/io");
const atendimento_model_1 = require("./../models/atendimento-model");
const atendimento_controller_1 = require("./atendimento-controller");
exports.getBrowser = (remetente) => __awaiter(void 0, void 0, void 0, function* () {
    remetente.browser = yield puppeteer.launch({
        headless: true,
        args: [
            '--user-data-dir=' + './cache/' + remetente.empresa_id.toString() + '/' + remetente.id.toString(),
            '--no-sandbox',
        ],
    });
    remetente.page = yield remetente.browser.newPage();
    yield remetente.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    yield remetente.page.setViewport({ width: 960, height: 768 });
    yield remetente.page.goto('https://web.whatsapp.com');
    yield remetente.page.evaluate(fs.readFileSync(path.join(__dirname, '..', 'libs', 'inject.js'), 'utf8'));
    yield remetente.page.evaluate('startMonitoring();');
    yield remetente.page.evaluate('startQrCodeMonitoring();');
    remetente.page.on('load', function (e) {
        remetente.page.evaluate(fs.readFileSync(path.join(__dirname, '..', 'libs', 'inject.js'), 'utf8'));
    });
    remetente.page.on('console', function (e) {
        try {
            //let remetenteImpusinamento = await database.query("");
            let evento = JSON.parse(e.text());
            console_service_1.CheckEvent(evento, remetente.id);
        }
        catch (e) {
            logs_1.LogErro('Erro no console! Mensagem inválida (Remetente: ' + remetente.id + ")" + '\n' + 'Texto: ' + e.text(), e);
        }
    });
    remetente.page.on('error', function (e) {
        logs_1.LogErro('Erro na página! (Remetente: ' + remetente.id + ")", e);
    });
    remetente.browser.on('disconnected', function (e) {
        logs_1.Log('Fechou Browser! (Remetente: ' + remetente.id + ")");
    });
    remetente.page.on('close', function (e) {
        logs_1.Log('Pagina Fechou! (Remetente: ' + remetente.id + ")");
    });
});
// #### criar um atulaizar remetente
exports.updateRemetente = (remetente, evento) => __awaiter(void 0, void 0, void 0, function* () {
    yield remetente.page.evaluate('getStatusJson();');
    yield conexao_1.database.query("update tb_remetente set battery = " + (evento.monitoring_phone.battery ? '1' : '0') +
        ", battery_charging = " + (evento.monitoring_phone.battery_charging ? '1' : '0') +
        ", batterylevel = " + (evento.monitoring_phone.battery_charge ? evento.monitoring_phone.battery_charge : '0') +
        ", status = '" + (evento.monitoring_phone.authenticated ? 'CONECTADO' : 'DESCONECTADO') +
        "' , mynumber = " + (evento.monitoring_phone.authenticated ? 'mynumber' : "''") +
        " where id = " + remetente.id);
    // Log('Monitoramento! | Remetente: ' + remetente.id + ' | ' + JSON.stringify(evento.monitoring_phone));
    io_1.io.emit('monitoring', JSON.stringify({ success: true, remetente_id: remetente.id }));
    //Atualizando objeto local da empresa(remetente) 
    // console.log('evento monitoring: ', evento.monitoring_phone.authenticated + ' id remetente: ', remetente.id);
    (evento.monitoring_phone.authenticated) ? remetente.status = 'CONECTADO' : remetente.status = 'DESCONECTADO';
    if (!evento.monitoring_phone.authenticated)
        remetente.mynumber = '';
});
exports.getConfig = (remetente) => __awaiter(void 0, void 0, void 0, function* () {
    let config = yield conexao_1.database.query("select * from tb_config where empresa_id = " + remetente.empresa_id + " limit 1");
    if (config[0][0]) {
        remetente.config = config[0][0];
        console.log('setou as configurações da empresa');
        //verificar atendimentos para os agentes
        // let atendientos = await getAtendimentosByEmpresaId(remetente.empresa_id);
        let atendientos = yield atendimento_model_1.getAtendimentosNaoAtendidos(remetente.empresa_id);
        for (let index = 0; index < atendientos.length; index++) {
            const atendimento = atendientos[index];
            yield atendimento_controller_1.checkAgenteDisponivel(atendimento);
        }
    }
    else {
        remetente.config = null;
    }
    // remetente.config = config![0]![0] || null;
});
exports.reinicializar = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    let listaRemetentes = yield conexao_1.database.query("SELECT r.*, gr.grupo_id, g.nome as grupo_nome FROM " +
        "tb_remetente r, tb_grupo_remetente gr, tb_grupo g WHERE g.id = gr.grupo_id and " +
        "r.id = gr.remetente_id AND r.`status` <> 'DESATIVADO' and r.empresa_id = " + empresa_id);
    if (!listaRemetentes[0])
        return;
    for (let index = 0; index < listaRemetentes[0].length; index++) {
        const item = listaRemetentes[0][index];
        let remetente = yield remetente_model_1.getRemetenteById(item.id);
        if (remetente) {
            remetente.descricao = item.descricao;
            remetente.remetente = item.remetente;
            remetente.tipo = item.tipo;
            if (remetente.grupo_id != item.grupo_id) {
                io_1.io.emit('deslogar', remetente.grupo_id);
            }
            remetente.grupo_id = item.grupo_id;
            remetente.grupo_nome = item.grupo_nome;
        }
        else {
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
            if (remetente.tipo == remetente_model_1.RemetenteTipo.WHATSAPP) {
                yield exports.getBrowser(remetente);
            }
            yield remetente_model_1.addRemetente(remetente);
        }
        yield exports.getConfig(remetente);
    }
});
exports.updateConfig = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    let remetentes = yield remetente_model_1.getRemetenteByEmpresaId(empresa_id);
    for (let index = 0; index < remetentes.length; index++) {
        const remetente = remetentes[index];
        yield exports.getConfig(remetente);
    }
});
exports.desativar = (remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dt = dataTempo.create();
    let data = dt.format('Y-m-d H:M:S');
    // console.log('id remetente: ' + remetente_id);
    let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
    // console.log('lista remetente: ' + remetente);
    if (remetente == undefined || remetente == null) {
        console.log('desativando o tronco...');
        // await remetente.page.evaluate('logout();');
        let statusRemetente = yield conexao_1.database.query("select status from tb_remetente where id = " + remetente_id);
        if (statusRemetente[0][0] && statusRemetente[0][0].status != 'DESATIVADO') {
            yield conexao_1.database.query("update tb_remetente set status = 'DESATIVADO' where id = " + remetente_id);
            yield conexao_1.database.query("update tb_atendimento set datahora_fim = '" + data + "' where remetente_id = " + remetente_id + " and datahora_fim is null");
        }
        else {
            yield conexao_1.database.query("update tb_atendimento set datahora_fim = '" + data + "' where remetente_id = " + remetente_id + " and datahora_fim is null");
        }
    }
    else {
        console.log('excluindo tronco whatsapp');
        if (remetente.tipo == remetente_model_1.RemetenteTipo.WHATSAPP) {
            // await remetente.page.evaluate('logout();');
            yield remetente.page.close();
            yield remetente.browser.close();
        }
        yield remetente_model_1.delRemetente(remetente);
        yield conexao_1.database.query("update tb_remetente set status = 'DESATIVADO' where id = " + remetente_id);
        yield conexao_1.database.query("update tb_atendimento set datahora_fim = '" + data + "' where remetente_id = " + remetente_id + " and datahora_fim is null");
    }
});
exports.reniciarTronco = (tronco_id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('id remetente: ' + remetente_id);
    let remetente = yield remetente_model_1.getRemetenteById(tronco_id);
    // console.log('lista remetente: ' + remetente);
    if (remetente == undefined || remetente == null) {
        // await remetente.page.evaluate('logout();');
    }
    else {
        if (remetente.tipo == remetente_model_1.RemetenteTipo.WHATSAPP) {
            yield remetente.page.evaluate('logout();');
            yield remetente.page.close();
            yield remetente.browser.close();
        }
        yield remetente_model_1.delRemetente(remetente);
    }
});
exports.getAtendimentosSemana = (empresa_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dadosAtendimentos = yield conexao_1.database.query("        SELECT" +
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
    if (!dadosAtendimentos[0])
        return false;
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
});
exports.checkContatos = (campanha_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dadoCampanha = yield conexao_1.database.query("select * from tb_whatsapp_mensagens where verificado = 0 and campanha_id = " + campanha_id);
    if (dadoCampanha[0].length == 0)
        return;
    let remetente = yield remetente_model_1.getRemetenteById(dadoCampanha[0][0].remetente_id);
    if (!remetente)
        return;
    for (let index = 0; index < dadoCampanha[0].length; index++) {
        const mensagem = dadoCampanha[0][index];
        yield remetente.page.evaluate('contactExist("' + mensagem.destino + '");');
    }
});
exports.updateRemetenteId = (remetente_id) => __awaiter(void 0, void 0, void 0, function* () {
    let dadosRemetente = yield conexao_1.database.query("select * from tb_remetente where id = " + remetente_id);
    // console.log('dados do remetente update: ',dadosRemetente[0][0].palavra_chave);
    let remetente = yield remetente_model_1.getRemetenteById(remetente_id);
    if (dadosRemetente[0][0]) {
        remetente.status = dadosRemetente[0][0].status;
        remetente.impulsionar = dadosRemetente[0][0].impulsionar;
        remetente.redirect = dadosRemetente[0][0].redirect;
        remetente.palavra_chave = dadosRemetente[0][0].palavra_chave;
    }
});
//# sourceMappingURL=remetente-controller.js.map