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
exports.routesApiWhatssap = (app) => __awaiter(void 0, void 0, void 0, function* () {
    app.get("/", function (request, response) {
        response.send('Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!');
    });
    app.post("/webhook", function (request, response) {
        console.log('Incoming webhook: ' + JSON.stringify(request.body));
        response.sendStatus(200);
    });
});
//# sourceMappingURL=routes-api-whatssap.js.map