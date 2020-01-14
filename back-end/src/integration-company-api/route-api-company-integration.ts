import * as express from "express";
import { sendMessageToApi } from './services/send-to-message-api';

export default (app: express.Application) => {
    //##api v1 de envio de mensagem## req.headers ||
    app.post('/api/v1/send-to-message', async (req, res) => {
        let sendMessage = await sendMessageToApi(req.body);

        res.status(sendMessage.statusCode).json({
            status: sendMessage.status,
            msg: sendMessage.msg,
            data: sendMessage.data
        })
    });
}