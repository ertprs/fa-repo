import * as mysql from 'mysql2/promise';
import { conexaoConfig } from './../globais/configs';

export var database: mysql.Connection;

export const handleDisconnect = async () => {
    database = await mysql.createConnection(conexaoConfig); // Recreate the connection, since

    // If you're also serving http, display a 503 error.
    database.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}