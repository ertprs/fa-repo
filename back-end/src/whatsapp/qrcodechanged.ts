import { database } from './../libs/conexao';
import { io } from './../libs/io';
import { getRemetenteById, Remetente } from './../models/remetente-model';

export const qrcodechanged = async (evento, remetente_id) => {
    let remetente = await getRemetenteById(remetente_id);
    if(remetente){
        await remetente.page.evaluate('getStatusJson();');
    }

    await database.query("update tb_remetente set qrcode = '" + evento.qr_code_url +
        "' where id = " + remetente_id);

    io.emit('qrcodechanged', JSON.stringify({ success: true, remetente_id: remetente_id }));
}
