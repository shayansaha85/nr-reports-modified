const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Retrieve environment variables
const MS_GRAPH_CLIENT_ID = process.env.MS_GRAPH_CLIENT_ID;
const MS_GRAPH_CLIENT_SECRET = process.env.MS_GRAPH_CLIENT_SECRET;
const MS_GRAPH_TENANT_ID = process.env.MS_GRAPH_TENANT_ID;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const RECEIVER_EMAILS = process.env.RECEIVER_EMAILS; // Comma-separated list of emails
const EMAIL_FILE_PATH = process.env.EMAIL_FILE_PATH;

async function getAccessToken() {
    try {
        const response = await axios.post(
            `https://login.microsoftonline.com/${MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: MS_GRAPH_CLIENT_ID,
                client_secret: MS_GRAPH_CLIENT_SECRET,
                scope: 'https://graph.microsoft.com/.default'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function sendEmail() {
    try {
        const accessToken = await getAccessToken();
        const htmlContent = await fs.readFile(path.resolve(EMAIL_FILE_PATH), 'utf8');
        
        // Parse the RECEIVER_EMAILS environment variable into an array
        const recipients = RECEIVER_EMAILS.split(',').map(email => ({
            emailAddress: {
                address: email.trim()
            }
        }));

        const response = await axios.post(
            `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`,
            {
                message: {
                    subject: 'Subject of the email',
                    body: {
                        contentType: 'HTML',
                        content: htmlContent
                    },
                    toRecipients: recipients
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Email sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.data : error.message);
    }
}

sendEmail();
