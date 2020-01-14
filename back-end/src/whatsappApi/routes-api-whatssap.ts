import * as express from "express";

export const routesApiWhatssap =  async (app: express.Application) => {
    app.get("/", function (request, response) {
        response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
    });
      
    app.post("/webhook", function (request, response) {
        console.log('Incoming webhook: ' + JSON.stringify(request.body));
        response.sendStatus(200);
    });
}