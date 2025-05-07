const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

// Create a transporter using the credentials from the .env file
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, // SMTP host
    port: process.env.MAIL_PORT, // SMTP port
    auth: {
        user: process.env.MAIL_USER, // SMTP username
        pass: process.env.MAIL_PASSWORD, // SMTP password
    },
    tls: {
        rejectUnauthorized: false, // <---- allow self-signed certs
    }
});

// Function to send an email
/**
 * Sends an email with the specified subject, text, HTML content, and optional attachment.
 * 
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text content of the email.
 * @param {string} html - The HTML content of the email.
 * @param {string|null} attachmentPath - The file path of the attachment (optional).
 * @returns {Promise<Object>} - The result of the email sending operation.
 */
async function sendMail(subject, text, html, attachmentPath = null) {
    try {
        const mailOptions = {
            from: process.env.MAIL_USER, // Sender email address
            to: process.env.MAIL_TO.split(','), // Recipient email address
            subject: subject, // Email subject
            text: text, // Plain text content
            html: html // HTML content
        };
        
        // Only add attachment if a path was provided
        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: path.basename(attachmentPath), // Extract filename from the path
                    path: attachmentPath // Path to the attachment
                }
            ];
        }

        // Send the email using the transporter
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId); // Log the message ID of the sent email
        return info; // Return the result of the email sending operation
    } catch (error) {
        console.error('Error sending email: ', error); // Log any error that occurs
        throw error; // Re-throw the error to be handled by the caller
    }
}

module.exports = sendMail; // Export the sendMail function for use in other modules
