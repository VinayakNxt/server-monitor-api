const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Create a transporter using the credentials from the .env file
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

// Function to send an email
async function sendMail(subject, text, html, attachmentPath = null) {
    try {
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: process.env.MAIL_TO,
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
