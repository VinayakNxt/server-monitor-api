const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Create a transporter using the credentials from the .env file
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    // secure: process.env.MAIL_SECURE === 'true', // Use secure connection if MAIL_SECURE is true
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
    // tls: {
    //     rejectUnauthorized: process.env.MAIL_IGNORE_TLS !== 'true', // Ignore TLS if MAIL_IGNORE_TLS is true
    //     requireTLS: process.env.MAIL_REQUIRE_TLS === 'true', // Require TLS if MAIL_REQUIRE_TLS is true
    // },
});

// Function to send an email
async function sendMail(to, subject, text, html, attachmentPath = null) {
    try {
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: to,
            subject: subject,
            text: text,
            html: html
        };
        
        // Only add attachment if a path was provided
        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: path.basename(attachmentPath),
                    path: attachmentPath
                }
            ];
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
    }
}

module.exports = sendMail;
