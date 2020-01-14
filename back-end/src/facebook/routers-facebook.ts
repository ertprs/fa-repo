import * as express from "express";
import { Log } from "../globais/logs";
import { getMessegerFacebook } from './get-messeger-facebook';

export const routersFacebook = async (app: express.Application) => {
    //iniciando o servidor webhook
    app.post('/webhook', (req, res) => {  
 
        let body = req.body;
        console.log('body puro: ',body);
      
        // Checks this is an event from a page subscription
        if (body.object === 'page') {
          console.log('listem of body: ',body.entry[0].id);
          getMessegerFacebook(body.entry[0]);
      
          // Iterates over each entry - there may be multiple if batched
          //body.entry.forEach(function(entry) {
      
            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            // let webhook_event = entry.messaging[0];
            // console.log('listem of webhook_event: ',webhook_event);
            // console.log('listem of webhook_event.message.attachments: ',webhook_event.message.attachments);
          //});
      
          // Returns a '200 OK' response to all requests
          res.status(200).send('EVENT_RECEIVED');
          Log("Evendo of POST of the Webhook! Event sucesss!!!");
        } else {
          // Returns a '404 Not Found' if event is not from a page subscription
          res.sendStatus(404);
          Log("Event of POST of the Webhook! Event erro!!!");
        }
      
    });

    // Adds support for GET requests to our webhook
    app.get('/webhook', (req, res) => {

        // Your verify token. Should be a random string.
        // let VERIFY_TOKEN = "123798465!AXVR458GGGG!@GGD"
        let VERIFY_TOKEN = "EAAF3zhIGvaEBAIagQigqTuUKbz3gu2po0rxtZCHg9RmiolZCvsdeokZB0lMn9ywTZC53ZCEa13MW36RYq9ug9be7GlLjyWas5jY8ygT8bEX38PbVnfrmpaNL20n4qWhlAsfM24oicHVwZBuvmx4KRCcSwtgYGReoyvCZBXw9KKTr3lqQZAnv9gDgBvSsqzgIsLQZD";
        
        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];
        
        // Checks if a token and mode is in the query string of the request
        if (mode && token) {
        
            // Checks the mode and token sent is correct
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                
                // Responds with the challenge token from the request
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
                Log("Evendo of GET of the Webhook! Event sucesss!!!");
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403); 
                Log("Evendo of GET of the Webhook! Event erro!!!");     
            }
        }
    });
}