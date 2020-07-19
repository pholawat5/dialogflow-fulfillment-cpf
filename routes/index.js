var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var request = require('request');
const line = require('@line/bot-sdk');


const { WebhookClient, Payload } = require('dialogflow-fulfillment');

//Initialize Firestore
const ServiceAccount = require('../service-key.json');
admin.initializeApp({
    credential: admin.credential.cert(ServiceAccount),
    databaseURL: 'https://cp-product-db.firebaseio.com'
});
const db = admin.firestore();
//End of Initialize Firestore
///tleeeee

router.post('/webhook', (req, res) => {
    const agent = new WebhookClient({
        request : req,
        response : res
    });

    async function generateOrderId(){
      const docRef = db.collection('OrderId').doc('num');
      const doc = await docRef.get();
      const currentId = (doc.data()).id;
      docRef.update({
        id : admin.firestore.FieldValue.increment(1)
      })
      return currentId;
    }

    //  Function Map To Intent

    async function getCatalogue(agent){
      //agent.add('Category From Database');
      var str = "";
      var arr = [];
      const snapshot = await db.collection('product').get();
      snapshot.forEach((doc) => {
        //agent.add((doc.data()).name);
        //agent.add((doc.data()).price);
        if (str != "") str.concat(",");
        nam = (doc.data()).name;
        price = (doc.data()).price;
        img = (doc.data()).image;
        stock = (doc.data()).stock;
        if (stock == 0 ) {
          var jsonp = {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": nam,
                  "wrap": true,
                  "size": "xl",
                  "align": "center",
                  "gravity": "top",
                  "weight": "bold",
                  "color": "#000000"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": img,
              "size": "full",
              "aspectRatio": "1.51:1"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": price,
                  "size": "xl",
                  "align": "center"
                },
                {
                  "type": "text",
                  "text": "Out of stock",
                  "align": "center",
                  "color": "#E70909"
                }
              ]
            }
          };
          arr.push(jsonp);
        } else {
          var jsonp = {
            "type": "bubble",
            "direction": "ltr",
            "header": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": nam,
                  "wrap": true,
                  "size": "xl",
                  "align": "center",
                  "gravity": "top",
                  "weight": "bold",
                  "color": "#000000"
                }
              ]
            },
            "hero": {
              "type": "image",
              "url": img,
              "size": "full",
              "aspectRatio": "1.51:1"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": price,
                  "size": "xl",
                  "align": "center"
                },
                {
                  "type": "text",
                  "text": stock.toString()+ " unit",
                  "align": "center",
                  "color": "#000000"
                }
              ]
            }
          };
          arr.push(jsonp);
        }
      });
      sumstr = {
        "type": "flex",
        "altText": "See catalogue",
        "contents": {
          "type": "carousel",
          "contents": arr
        }
      }
      let payload = new Payload(`LINE`, sumstr, { sendAsMessage: true});
        agent.add(payload);
  
    }

    async function askForDes(agent){
      let namePro = agent.parameters.name;
      const snapshot = await db.collection('product').get();
      snapshot.forEach((doc) => {
      nam = (doc.data()).name;
      if( nam == namePro) {
        size = (doc.data()).size;
        img = (doc.data()).image;
        descr = (doc.data()).description;
        var jsonD = {
          "type": "flex",
          "altText": "See Description",
          "contents": {
            "type": "bubble",
            "direction": "ltr",
            "hero": {
              "type": "image",
              "url": img,
              "size": "full",
              //"aspectRatio": "1.51:1",
              "aspectMode": "fit"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": nam,
                  "size": "md",
                  "weight" : "bold",
                  "align": "start"
                },
                {
                  "type": "separator"
                },
                {
                  "type": "text",
                  "size": "md",
                  "text": size
                },
                {
                  "type": "text",
                  "size": "md",
                  "wrap": true,
                  "text": descr
                }
              ]
            }
          }
        }
        let payload = new Payload(`LINE`, jsonD, { sendAsMessage: true});
        agent.add(payload);
      } 
      });
    }

    async function getSpecificCategory(agent) {
        //get Parameter as a type
        //show All Menu of parameter.type
    }

    async function checkOut(agent) {
      var orderId = await generateOrderId();
      var amount = 500 // Combine w/ micky
      const orderRef = db.collection('orders').doc(orderId + '').set({
        orderId : orderId,
        amount : amount
      })
      let token = await getAccessToken();
      let bar = await getPaymentDeepLink(token, amount, '' + orderId, '1')
      
      agent.add('https://liff.line.me/1654445748-DdaMEMb3?orderId=' + orderId + '&link=' + bar + '&status=false');
    };


      //==================================SCB PAYMENT=================================
  function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

  function getAccessToken(){
    var options = {
      method: 'POST',
      url: 'https://api-sandbox.partners.scb/partners/sandbox/v1/oauth/token',
      headers: {
        'resourceOwnerId': 'l75ac72c3427434a41addbd089bb58d6c8',
        'requestUId': create_UUID(),
        'Content-Type': 'application/json'
      },
      body: {
        'applicationKey': 'l75ac72c3427434a41addbd089bb58d6c8',
        'applicationSecret': '0c35f386997d4611a957579ea93f2ab9'
      },
      json : true
    };

    return new Promise(function (resolve,reject){
      request(options, function (error, res, body){
        if (!error && res.statusCode == 200){
          resolve(body.data.accessToken);
        }else{
          reject(error);
        }
      });
    });
  }

  function getPaymentDeepLink(accessToken, amount, ref1, ref2){
    var options = { 
      method: 'POST',
      url: 'https://api-sandbox.partners.scb/partners/sandbox/v3/deeplink/transactions',
      headers: {
        'resourceOwnerId': 'l75ac72c3427434a41addbd089bb58d6c8',
        'requestUId': create_UUID(),
        'channel': 'scbeasy',
        'authorization': 'bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: {
        "transactionType": "PURCHASE",
        "transactionSubType": ["BP"],
        "billPayment": {
          "paymentAmount": amount,
          "accountTo": "395774125591677",
          "ref1": ref1,
          "ref2": ref2,
          "ref3": "SCB"
        }
      },
      json: true
    };
    return new Promise(function (resolve, reject) {
      request(options, function (error, res, body) {
        if (!error && res.statusCode == 201) {
          resolve(body.data.deeplinkUrl);
        } else {
          reject(error);
        }
      });
    });
  }
//==============================================================================

    function askAddress(agent) {
        //generateOrderId()
        //add OrderId and Order From Basket To Firestore collection(orders)
        //agent.add(LIFF URL?orderId = orderId)
        /*  LIFF
            1. getProfile()
            2. Create New User or Use Existing Order
            3. Confirm Address
            4. find collection(orders) using orderId
            5. add Order to Firestore collection(users) √
            6. add userId to the order in collection(orders)
            6. Send Request to Line Push Message API to send All item in orders
               and Confirmation Button ( Yes OrderId = ???)
         */
    }

    function payFlexMessage(agent){
        /*

          add Order to Orders Collection
          send orderId parameter to LIFF
          LIFF
          1.getProfile()
          2.find Doc of OrderId and update userId
          3.Send Push Message API

        */
        //call Liff PaymentWith parameter OrderId and UserId
        //Liff call Line Push Message API to send Success Payment Message and Change Payment Status in Firestore to success
    }

    // End Function Map To Intent

    const itemConfirmYes = (agent) => {
        const item = agent.context.get("item"),
              food = item.parameters.food,
              quantity = item.parameters.quantity,
              type = item.parameters.type;
  

        var basketContext = {
            name: "basket",
            lifespan: 50,
            parameters: {},
        },
        items = {};
        if (agent.context.get("basket")) {
            items = agent.context.get("basket").parameters.items;
        }
        if(JSON.stringify(items) == "{}"){
          agent.add(`น้องอิ่มเอมใส่ ${type}${food} จำนวน ${quantity} ที่ ไว้ในตะกร้าแล้วนะคะ`);
          agent.add('หากต้องการเช็คของในตะกร้าให้พิมพ์ว่า "ตะกร้า" และหากต้องการชำระเงินให้พิมพ์ว่า "เช็คบิล"')
        }else{
          agent.add(`คอนเฟิร์ม ${type}${food} จำนวน ${quantity} ที่ค่ะ สนใจอะไรเพิ่มอีกไหมคะ`);
        }
        items[req.body.responseId] = {
            food: food,
            quantity: quantity,
            type: type,
        };
        basketContext.parameters.items = items;
        console.log(JSON.stringify(basketContext));
        agent.context.set(basketContext);
        
    };
    
    const orderShowBasket = (agent) => {
        if (agent.context.get("basket")) {
            const basket = agent.context.get("basket"),
                  basketItems = basket.parameters.items,
                  itemKeys = Object.keys(basketItems);
        var basketOutput = "ที่สั่งไปแล้วตอนนี้มีดังนี้ค่ะ ";
        for (let i = 0; i < itemKeys.length; i++) {
            let item = basketItems[itemKeys[i]];
            if (i > 0 && i === itemKeys.length - 1) {
                basketOutput += ` และ `;
            } else if (i > 0) {
                basketOutput += ` , `;
            }
            basketOutput += `${item.type}${item.food} จำนวน ${item.quantity} ที่`;
        }
            agent.add(basketOutput);
        } else {
            agent.add("You've not order yet!");
        }
    };

    const confirmOrder = (agent) => {
      if (agent.context.get("basket")) {
          const basket = agent.context.get("basket"),
                basketItems = basket.parameters.items,
                itemKeys = Object.keys(basketItems);
      var basketOutput = "ออเดอร์มีดังนี้นะคะ ";
      for (let i = 0; i < itemKeys.length; i++) {
          let item = basketItems[itemKeys[i]];
          if (i > 0 && i === itemKeys.length - 1) {
              basketOutput += ` และ `;
          } else if (i > 0) {
              basketOutput += ` , `;
          }
          basketOutput += `${item.type}${item.food} จำนวน ${item.quantity} ที่`;
      }
          agent.add(basketOutput);
      } else {
          agent.add("You've not order yet!");
      }
  };


    const orderClearBasket = (agent) => {
        agent.context.delete("basket");
        agent.add("Your basket is now empty!");
    };

    let intentMap = new Map();
    intentMap.set('getCatalogue', getCatalogue);
    intentMap.set('checkOut', checkOut);
    intentMap.set('checkOut2', checkOut);
    intentMap.set("order-showbasket", orderShowBasket);
    intentMap.set("order-clearbasket", orderClearBasket);
    intentMap.set("item-confirm-yes", itemConfirmYes);
    intentMap.set("askForDes", askForDes);
    intentMap.set("confirmOrder", confirmOrder)
    agent.handleRequest(intentMap);

});

router.post('/scb/payment/confirm', async (req, res) => {
  const client = new line.Client({
    channelAccessToken: 'X/7imTcgi4I91zPgF/TPJmifeFTFiSa1/MyGSDBDF0xlyrC6YUmpMl2Fjwd+jiS7RMdWIzz616KKSCCayKU+A0h7wOGsfBO5aH1STbKlziyRqw7621vhNuK65GabcQjTeGuauS1Sk0Mw5dIdZkDe0gdB04t89/1O/w1cDnyilFU='
  });
  
  
  const getId = await db.collection('orders').doc(req.body.billPaymentRef1).get()
  var destination = getId.data().userId;
  const userRef = db.collection('orders').doc(req.body.billPaymentRef1).update({
    status: 'Payment Success'
  });

  const message = {
    type: 'text',
    text: 'Order Number #' + req.body.billPaymentRef1 + ' has been placed'
  };

  client.pushMessage(destination, message);
  res.send('');
});

module.exports = router;
