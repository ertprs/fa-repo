import { getRemetentes } from './../models/remetente-model';
import { database } from './../libs/conexao';
import { Log } from './../globais/logs';
import * as dataTempo from 'node-datetime';
import { io } from './../libs/io';

export const statusTronco = async () => {
    // console.log('entrei no status do tronco');
    let empresas = [];
    let troncos: any = await getRemetentes();

    for (let index = 0; index < troncos.length; index++) {
        const tronco = troncos[index];
        
        let empresa = empresas.find(x => x.empresa_id == tronco.empresa_id);
        if (!empresa) {
            empresa = {
                empresa_id: tronco.empresa_id,
                troncos: []
            }
        }

        empresas.push(empresa);
    }

    for (let index = 0; index < empresas.length; index++) {
        const empresa = empresas[index];
        
        let dadosTroncos: any = await database.query("select id, descricao, status, batterylevel, remetente, whatsapp_fixo_movel, empresa_id " +
        " from tb_remetente where status <> 'DESATIVADO' and tipo = 'WHATSAPP' and empresa_id = "+empresa.empresa_id);
       
        if (dadosTroncos![0]) {
            io.emit('troncoStatus', empresa.empresa_id, JSON.parse(JSON.stringify(dadosTroncos[0])));
        }
    }
}