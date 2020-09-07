const express = require('express');
const HyperledgerApp = require('./hyperledgerApp.js');
const { IdentityProviderRegistry } = require('fabric-network');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require ('body-parser');
const path = require('path');
const { check, validator, validationResult } = require('express-validator');
const cookieSession = require('cookie-session');


// Load the database object
const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Initialize the server object
const server = express();
const PORT = 3000;

// Communicate with the chaincode by create a hyperledgerApp object
const hyperledgerApp = new HyperledgerApp();

server.set('trust proxy', 1);

server.use(cookieSession({
    name: 'session',
    keys: ['Jason238497mkasns', 'asdjasni673mes345'],
}))

server.use(express.static(__dirname + '/public'));

// bodyParse setup
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());


// let lastUpdateEntries = 0; used for updating new added users

server.get('/registeredUsers', async (req, res) => {
    try {
            await client.connect();

            const users = await client.db("firstdb").collection("Users").find({}).toArray();

            if (!users) {
                throw new Error ("Nothing found from database");
            }

            // lastUpdateEntries = users.length;
            
            res.send(users);
    } catch (err) {
        console.log(`Problems connecting with database ${err}`);
    }
})

// Get new added users from the database
/*
const newUsers = await client.db("firstdb").collection("Users").find().skip(parseInt(lastUpdateEntries)).toArray();
    if (newUsers) {
        lastUpdateEntries += newUsers.length;
        res.send(newUsers);
    }
    res.end()
*/

// An endpoint returns all certificates on the ledger
server.get('/getAllCerts', async (req, res) => {
    const certs = await hyperledgerApp.GetAllCerts();
    res.send(certs);
})

// produce the certId to be stored on the ledger
const produceCertId = (firstName, lastName, unitCode) => {
    // certID = first name + last name + last 3 digits from the unitCode
    const processedFirstName = firstName.trim().toLowerCase();
    const processedLastName = lastName.trim().toLowerCase();
    const processedUnitCode = unitCode.substring(3);

    const certId = processedFirstName + processedLastName + processedUnitCode;
    
    return certId;
}

// Create certificates with information filled in the form
server.post(
    '/createCert',
    [
        check(['firstName', 'lastName'])
            .trim()
            .isLength({min : 2})
            .isAlpha()
            .notEmpty()
            .escape()
            .withMessage('First and last name is required'),
        check('unitCode')
            .trim()
            .isLength({min : 6}, {max : 6})
            .isAlphanumeric()
            .notEmpty()
            .withMessage('6-character unit code is required'),
        check('grade')
            .trim()
            .isInt({min : 0}, {max : 100})
            .withMessage('Grade is required'),
        check('credit')
            .trim()
            .isInt({min : 0}, {max : 5})
            .withMessage('Credit point is required')
    ], async (req, res) => {
        // console.log(req.body);
        const errors = validationResult(req);
        const result = {};

        if (!errors.isEmpty()) {
            req.session.createCert = {
                errors : errors.array(),
            };
            result.error = 'Errors!';
            return res.send(result);
        }

        const { firstName, lastName, unitCode, grade, credit } = req.body;

        const certId = produceCertId(firstName, lastName, unitCode);

        const owner = firstName + ' ' + lastName;

        await hyperledgerApp.CreateCert(certId, unitCode, grade, owner, credit);
        result.certId = certId;
        res.send(result);
    }
)

// An endpoint to return a confirmation of a created certificate
server.get('/createCert', (req, res) => {
    // console.log(req.session.createCert);
    const errors = req.session.createCert ? req.session.createCert.errors : false;
    req.session.createCert = {};

    res.send(errors);
})

// An endpoint returns certificates based on the given name
server.get('/getCertByOwner', async (req, res) => {
    const { firstName, lastName } = req.query;

    const owner = firstName + ' ' + lastName;

    const certs = await hyperledgerApp.GetCertsByOwner(owner);

    res.send(certs);
})

// An endpoint returns history of a certificate
server.get('/getCertHistory', async (req, res) => {
    const { certId } = req.query;

    const certHistory = await hyperledgerApp.GetCertHistory(certId);

    res.send(certHistory);
})

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})