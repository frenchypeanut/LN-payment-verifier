const express = require('express')
var bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const port = 3005;
const request = require('request');

const http = require('http');

const opennode = require('opennode');

// const opennodeApiKey = '598e5042-9044-4c1a-bdd7-3f7a8cf8e006';
const opennodeApiKey = 'b03562d1-c748-432c-904c-07dffd9b3479';

const io = require('socket.io')();

const port_io = 8007;
io.listen(port_io);

console.log('Socket listening on port ', port_io);

io.on('connection', (socket) => {
  console.log("Connected to Socket for Lightning interactions!   " + socket.id)

  socket.on('disconnect', function(){
		console.log('Disconnected - '+ socket.id);
  });
  
  socket.on('invoicePayment', (invoiceData) => {
    console.log("invoice waiting for payment: " + invoiceData);
  });

  socket.on('newInvoice', async function(){
    // opennode.setCredentials('598e5042-9044-4c1a-bdd7-3f7a8cf8e006', 'dev'); //if no parameter given, default environment is 'live'
    opennode.setCredentials('b03562d1-c748-432c-904c-07dffd9b3479'); //if no parameter given, default environment is 'live'
    //(async ()=> { b03562d1-c748-432c-904c-07dffd9b3479
    try {
        const charge = await opennode.createCharge({
            amount: 0.01,
            description: "block-hub.xyz",
            currency: "JPY",
            // Change this line!!!
            callback_url: "http://52085d64.ngrok.io/paymentComplete",
            // callback_url: "http://block-hub.xyz:3000/paymentComplete",
            auto_settle: false
        });
        console.log(charge);
        invoiceTest = charge.id;
        io.emit('invoiceGenerated', charge);
    }
    catch (error) {
     console.error(`${error.status} | ${error.message}`);
    }
  });

});

app.get('/', (req, res) => {
  return res.send('Lightning API')
});

app.post("/paymentComplete", async (req, res, next) => {
  console.log(req.body.status);
  if(req.body.status == "paid")
  {
    io.emit('paymentComplete', true);
  }
  return res.send('block-hub.xyz');
});

app.listen(port, () => console.log(`Lightning API listening on port ${port}!`))