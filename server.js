const express = require('express');
const path = require('path');
const {Client, Config, CheckoutAPI} = require('@adyen/api-library');
const { uuid } = require("uuidv4");
const dotenv = require("dotenv");
const cors = require("cors");


const apiKey = "AQErhmfxLY7JbhZEw0m/n3Q5qf3VZo5eHYFPS3ZZC48v5c/dWKPWIGXf31YKrhDBXVsNvuR83LVYjEgiTGAH-B1dXJeTnNXcZ2+jRPjdcNOFweumzwnFv0Eaja5eX1RU=-tJ84Crr4I47KVgBh";
const merchantAccount = "NespressoKR";

dotenv.config({
    path: "./.env",
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "..", "demo")));
app.use('/status/:type', express.static(path.join(__dirname, "..", "..", "demo")))
// Adyen config
const config = new Config();
config.apiKey = apiKey;
config.merchantAccount = merchantAccount;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

const paymentDataStore = {};
const originStore = {};

app.use(cors({
    origin: '*'
}));

// Get payment methods
app.post("/api/getPaymentMethods", async (req, res) => {
    let response;
    try {
        response = await checkout.paymentMethods({
            channel: "Web",
            merchantAccount,
            blockedPaymentMethods: ["scheme"]
        });

        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    }
});

// Post Payment Method
app.post("/api/initiatePayment", async (req, res) => {
    const { paymentMethodType } = req.body;
    const currency = findCurrency(req.body.paymentMethodType);
    const orderRef = uuid();
    const shopperIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    try {
        const response = await checkout.payments({
            amount: { currency, value: 1000 },
            paymentMethod: {
                type: paymentMethodType
            },
            reference: orderRef,
            merchantAccount, 
            channel: "Web",
            origin: "http://localhost:8080",
            returnUrl: `http://localhost:8080/api/handleShopperRedirect?orderRef=${orderRef}`,
        });
        const { action } = response;

        if (action) {
            paymentDataStore[orderRef] = action.paymentData;
            const originalHost = new URL(req.headers["referer"]);
            if (originalHost) {
                originStore[orderRef] = originalHost.origin;
            };
        };

        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    }
});

app.post("/api/submitAdditionalDetails", async (req, res) => {
    // Create the payload for submitting payment details
    const payload = {
        details: req.body.details,
        paymentData: req.body.paymentData,
    };
  
    try {
        const response = await checkout.paymentsDetails(payload);
    
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    };
});

// Handle all redirects from payment type
app.all("/api/handleShopperRedirect", async (req, res) => {
    const { orderRef } = req.query;
    const redirect = req.method === "GET" ? req.query : req.body;
    const details = {};
    if (redirect.payload) {
        details.payload = redirect.payload;
    } else if (redirect.redirectResult) {
        details.redirectResult = redirect.redirectResult;
    } else {
        details.MD = redirect.MD;
        details.PaRes = redirect.PaRes;
    };

    const originalHost = originStore[orderRef] || "";
    const payload = {
        details,
        paymentData: paymentDataStore[orderRef],
    };
  
    try {
        const response = await checkout.paymentsDetails(payload);

        switch (response.resultCode) {
            case "Authorised":
                res.redirect(`/status/success?pspReference=${response.pspReference}&paymentMethod=${response.paymentMethod}`);
            break;
            case "Pending":
            case "Received":
                res.redirect(`${originalHost}/status/pending`);
            break;
            case "Refused":
                res.redirect(`${originalHost}/status/failed`);
            break;
            default:
                res.redirect(`${originalHost}/status/error?reason=${response.resultCode}`);
            break;
        };
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.redirect(`${originalHost}/status/error?reason=${err.message}`);
    };
});
  

function findCurrency(type) {
    switch (type) {
        case "wechatpayqr":
        case "alipay":
            return "CNY";
        case "dotpay":
            return "PLN";
        case "kakaopay": 
        case "unionpay": 
            return "KRW";
        case "boletobancario":
            return "BRL";
        default:
            return "EUR";
    };
};


// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
