// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail')
const ipn = require('paypal-ipn');
const querystring = require("querystring");

const {
    SENDGRID_API_KEY,
    SENDGRID_TO_EMAIL,
    SENDGRID_FROM_EMAIL,
  } = process.env;

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
  
    // When the method is POST, the name will no longer be in the event’s
    // queryStringParameters – it’ll be in the event body encoded as a query string
    const params = querystring.parse(event.body);

    console.log(ipn)
    console.log(params)
  
    ipn.verify(params, {'allow_sandbox': true}, function callback(err, msg) {

        console.log("Function being called")

        if (err) {
          console.error(err);
        } else {
       
          if (params.payment_status == 'Completed') {
            // Payment has been confirmed as completed
            console.log(SENDGRID_API_KEY)
            sgMail.setApiKey(SENDGRID_API_KEY)
            console.log(sgMail)
            const msg = {
                to: 'jweston491@gmail.com', // Change to your recipient
                from: 'jacob.weston@wsu.edu', // Change to your verified sender
                subject: params.first_name + ' ' + params.last_name + ' registered for ' + params.item_name,
                text: params.first_name + ' ' + params.last_name + ' registered for ' + params.item_name + '.',
                html: '<p>Contact Info:<br/>Name: ' + params.first_name + ' ' + params.last_name + '<br/>Email: ' + params.payer_email + '<br/>Phone: ' + params.contact_phone + '</p><p>Address:<br/>' + params.address_street + '<br/>' + params.address_city + '<br/>' + params.address_state + ' ' + params.address_zip + ', ' + params.address_country + '</p>',
            }
            sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })
          }
        }
      });
  };
