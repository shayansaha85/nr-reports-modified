const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const MS_GRAPH_CLIENT_ID = 'xxxx';
const MS_GRAPH_CLIENT_SECRET = 'xxxx';
const MS_GRAPH_TENANT_ID = 'xxxx';

const SENDER_EMAIL = 'xxxx';

const emailFilePath = './MPEREPORT.html';

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
        const htmlContent = await fs.readFile(path.resolve(emailFilePath), 'utf8');
        const recipients = [
            'xxxx'
        ];

        const toRecipients = recipients.map(email => ({
            emailAddress: {
                address: email
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
                    toRecipients: toRecipients
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
