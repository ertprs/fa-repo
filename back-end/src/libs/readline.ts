import * as readline from 'readline';
import { getAgentes } from './../models/agente-model';
import { Log } from './../globais/logs';
import { getAtendimentos } from './../models/atendimento-model';
import { io } from './io';
import { getRemetentes } from './../models/remetente-model';

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    (async() => {
        if (input == 'getRemetentes') {
            return Log(JSON.stringify(await getRemetentes()));
        }

        if (input == 'getAgentes') {
            return Log(JSON.stringify(await getAgentes()));
        }

        if (input == 'getAtendimentos') {
            return Log(JSON.stringify(await getAtendimentos()));
        }

        if (input == 'reloadAgentes') {
            let agentes = await getAgentes();
            for (let index = 0; index < agentes.length; index++) {
                const agente = agentes[index];
                io.emit('deslogar', agente.grupo_id);
                console.log('Desconectando agente!');                
            }    
            
            return;
        }
        return console.log('Comando inválido!');
    })()
    
});