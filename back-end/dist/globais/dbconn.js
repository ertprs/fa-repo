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
// import * as mysql from 'mysql2/promise';
const mysql = require("mysql2/promise");
const configs_1 = require("./../globais/configs");
exports.execSQL = (SQL) => __awaiter(void 0, void 0, void 0, function* () {
    let conn;
    let sResult;
    conn = yield mysql.createConnection(configs_1.conexaoConfig);
    sResult = yield conn.query(SQL);
    yield conn.end();
    return sResult[0];
});
//# sourceMappingURL=dbconn.js.map