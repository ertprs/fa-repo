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
const send_to_message_api_1 = require("./services/send-to-message-api");
exports.default = (app) => {
    //##api v1 de envio de mensagem## req.headers ||
    app.post('/api/v1/send-to-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        let sendMessage = yield send_to_message_api_1.sendMessageToApi(req.body);
        res.status(sendMessage.statusCode).json({
            status: sendMessage.status,
            msg: sendMessage.msg,
            data: sendMessage.data
        });
    }));
};
//# sourceMappingURL=route-api-company-integration.js.map