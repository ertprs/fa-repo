
import { Log } from './../globais/logs';
import { getRemetenteById, Remetente } from './../models/remetente-model';
import { io } from './../libs/io';
import { database } from './../libs/conexao';

export const status = async (evento, remetente_id) => {
    let remetente: Remetente = await getRemetenteById(remetente_id);
    // console.log('evento.status: ',evento.status); //methods: isConnected || batteryLevel
    if (evento.status.isConnected) {
        //tronco conectado
        console.log('tronco id: ' + remetente_id + ' está conectado');
        if (remetente.status == 'DESCONECTADO') {
            remetente.status = 'CONECTADO';            
        }
        await database.query("update tb_remetente set status = 'CONECTADO' where id = " + remetente.id);
    } else {
        //tronco desconectado
        console.log('tronco id: ' + remetente_id + ' está desconectado');
        if (remetente.status == 'CONECTADO') {
            remetente.status = 'DESCONECTADO'; 
        }
        await database.query("update tb_remetente set status = 'DESCONECTADO' where id = " + remetente.id);
    }

    if (evento.status.batteryLevel) {
        console.log('nivel de bateria: ',evento.status.batteryLevel);
        if (remetente.batteryLevel != evento.status.batteryLevel) {
            remetente.batteryLevel = evento.status.batteryLevel;
            await database.query("update tb_remetente set batterylevel = '" + remetente.batteryLevel + "'" +
                    " where id = " + remetente.id);
            console.log('nivel de bateria: ',evento.status.batteryLevel);
        }
    }

    // if (enviarStatusTronco) {
    //     //envio o status do tronco
    //     let dadosTronco = {
    //         "numero_do_tronco" : (evento.status.myNumber ? evento.status.myNumber : remetente.mynumber),
    //         "status" : evento.status.isConnected,
    //         "battery" : (evento.status.batteryLevel ? evento.status.batteryLevel : '0')
    //     }
    //     io.emit('troncoStatus', remetente.empresa_id, JSON.parse(JSON.stringify(dadosTronco)));
    //     enviarStatusTronco = false;
    // }

    if (evento.status.isConflicted) {
        Log('Detectado tentativa de conexão do remetente (' + remetente_id + ') em outro navegador!');
        // global.Log('Detectado tentativa de conexão do remetente ('+remetente.id+') em outro navegador!');
        await remetente.page.click('#app > div > div > div > div > div > div > div._3QNwO > div._1WZqU.PNlAR');
    }

    if (evento.status.myNumber) {
        let numero = evento.status.myNumber;
        // console.log('numero: ',numero);
        if (evento.status.myNumber.length == 12 && remetente.tipo_phone_whatsapp == 'MÓVEL') 
            numero = evento.status.myNumber.substring(0, 4) + '9' + evento.status.myNumber.substring(4);
        // console.log('numero2: ',numero);
        // console.log('remetente.mynumber: ',remetente.mynumber);

        if (numero != remetente.remetente.replace(/[^0-9]/g, '')) {
            remetente.mynumber = '';
            remetente.page.evaluate('logout();');
            Log('Autenticação inválida! | Remetente: ' + remetente.id + ' com o número: ' + numero);
            io.emit('validateAuth', JSON.stringify({
                success: false, remetente_id: remetente.id, numero: numero,
                erro: 'Número autenticado diferente do cadastrado (Cadastrado: ' + remetente.remetente.replace(/[^0-9]/g, '') +
                    ', Autenticado: ' + numero + ')'
            }));
        } else if (numero == remetente.remetente.replace(/[^0-9]/g, '')) {
            if (!remetente.mynumber) remetente.mynumber = numero;
            if (remetente.mynumber) {
                // remetente.mynumber = numero;
                await database.query("update tb_remetente set myNumber = '" + numero + "'" +
                    " where id = " + remetente.id);

                Log('Autenticação! | Remetente: ' + remetente.id);
                remetente.autenticado = true;
                io.emit('validateAuth', JSON.stringify({ success: true, remetente_id: remetente.id }));
            }
        }
    }
}