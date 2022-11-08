const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();

const port = 3000;

const indexPage = fs.readFileSync(`${__dirname}/templates/index.html`, 'utf-8');
const dataPage = fs.readFileSync(`${__dirname}/templates/data.html`, 'utf-8');
const consentPage = fs.readFileSync(
    `${__dirname}/templates/consent.html`,
    'utf-8'
);

const config = {
    headers: {
        'x-client-id': process.env.CLIENT_ID,
        'x-client-secret': process.env.CLIENT_SECRET,
    },
};

app.get('/', (req, res) => {
    res.send(indexPage);
});

app.get('/create-consent', async (req, res) => {
    try {
        const currentTimeStamp = new Date().toJSON();
        const targetPhone = req.query.phone;
        const consentData = {
            Detail: {
                consentStart: currentTimeStamp,
                consentExpiry: '2023-04-23T05:44:53.822Z',
                Customer: {
                    id: `${targetPhone}@onemoney`,
                },
                FIDataRange: {
                    from: '2021-04-01T00:00:00Z',
                    to: '2021-10-01T00:00:00Z',
                },
                consentMode: 'STORE',
                consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
                fetchType: 'PERIODIC',
                Frequency: {
                    value: 30,
                    unit: 'MONTH',
                },
                DataFilter: [
                    {
                        type: 'TRANSACTIONAMOUNT',
                        value: '5000',
                        operator: '>=',
                    },
                ],
                DataLife: {
                    value: 1,
                    unit: 'MONTH',
                },
                DataConsumer: {
                    id: 'setu-fiu-id',
                },
                Purpose: {
                    Category: {
                        type: 'string',
                    },
                    code: '101',
                    text: 'Loan underwriting',
                    refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
                },
                fiTypes: ['DEPOSIT'],
            },
            redirectUrl: 'http://127.0.0.1:3000/data-session',
        };


        const consent = await axios.post(
            'https://fiu-uat.setu.co/consents',
            consentData,
            config
        );
        const consentURL = consent.data.url;

        const output = consentPage.replace('{%CONSENT_URL%}', consentURL);
        res.send(output);
    } catch (err) {
        res.send(err);
    }
});

app.get('/data-session', async (req, res) => {
    try {
        const success = req.query.success;

        if (success === 'false') return res.send(indexPage);

        const consentId = req.query.id;

        const sessionQuery = {
            consentId: consentId,
            DataRange: {
                from: '2021-04-01T00:00:00Z',
                to: '2021-09-30T00:00:00Z',
            },
            format: 'json',
        };

        const session = await axios.post(
            'https://fiu-uat.setu.co/sessions',
            sessionQuery,
            config
        );

        const sessionId = session.data.id;

        const output = dataPage.replace('{%ID%}', sessionId);

        res.send(output);
    } catch (err) {
        res.send(err);
    }
});

app.get('/get-data/:id', async (req, res) => {
    try {
        const sessionId = req.params.id;

        const sessionData = await axios.get(
            `https://fiu-uat.setu.co/sessions/${sessionId}`,
            config  
        );

        res.send(sessionData.data.Payload);
    } catch (err) {
        res.send(err);
    }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
