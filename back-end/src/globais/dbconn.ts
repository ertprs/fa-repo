// import * as mysql from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import { conexaoConfig } from './../globais/configs';
import { Log } from './logs';

export const execSQL = async (SQL: string) => {
    let conn: mysql.Connection;
    let sResult: any;
    conn = await mysql.createConnection(conexaoConfig); 
    sResult = await conn.query(SQL);
    await conn.end();
    return sResult[0];
}