
import { database } from './../libs/conexao';
export const updateContatoValido = async (remetente_id, numero, contatoValido) => {    
    await database.query("update tb_whatsapp_mensagens set verificado = 1, numero_valido = "+(contatoValido ? "1 " : "0 ") +
    " where remetente_id = " + remetente_id + " and destino = '"+numero+"' and verificado = 0 ");
}