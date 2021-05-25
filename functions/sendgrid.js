// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail')
const ipn = require('paypal-ipn');
const querystring = require("querystring");

const {
    SENDGRID_API_KEY,
    SENDGRID_TO_EMAIL,
    SENDGRID_FROM_EMAIL,
    SENDGRID_CC_EMAILS
  } = process.env;

const ipnVerify = async ( params ) => {
    console.log("Verifying...")
    return new Promise((resolve, reject) => {
        ipn.verify(params, {'allow_sandbox': true}, function callback(err, msg) {
            if (err) return reject(err);
            resolve();
        })
    })
}

exports.handler = async ( event, context ) => {

    try {
        console.log("Trying")
        // Only allow POST
        if (event.httpMethod !== "POST") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }
        // When the method is POST, the name will no longer be in the event’s
        // queryStringParameters – it’ll be in the event body encoded as a query string
        const params = querystring.parse(event.body);

        await ipnVerify( params )

        // Split CC emails
        let cc = SENDGRID_CC_EMAILS.split(",");

        if (params.payment_status == 'Completed' && params.item_number == "ORG") {
            // Payment has been confirmed as completed
            console.log("Payment complete")
            sgMail.setApiKey(SENDGRID_API_KEY)
            console.log("Set API Key")
            console.log(params)
            const msg = {
                to: SENDGRID_TO_EMAIL, // Change to your recipient
                from: {
                    email: SENDGRID_FROM_EMAIL, // Change to your verified sender
                    name: "CSS AgriBusiness"
                },
                subject: params.first_name + ' ' + params.last_name + ' registered for ' + params.item_name,
                cc: cc,
                html: '<p>Item Name: ' + params.item_name + '</p><p>Contact Info:<br/>Name: ' + params.first_name + ' ' + params.last_name + '<br/>Email: ' + params.payer_email + '<br/>Phone: ' + params.contact_phone +'</p><p>Discount: ' + params.discount + '<br/>Total:<br/>' + params.payment_gross + '</p>',
            }
            try {
                await sgMail.send(msg);
                console.log("Mail sent")
                return {
                  statusCode: 200,
                  body: 'Message sent',
                };
            } catch (err) {
                return {
                    statusCode: err.code,
                    body: JSON.stringify({ msg: err.message }),
                };
            }
        }
    }
    catch (e) {
        console.log(e)
    }
}