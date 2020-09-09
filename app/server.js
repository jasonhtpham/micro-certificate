const express = require('express');
const HyperledgerApp = require('./hyperledgerApp.js');
const { IdentityProviderRegistry } = require('fabric-network');
const bodyParser = require ('body-parser');
const path = require('path');
const { check, validator, validationResult } = require('express-validator');
const cookieSession = require('cookie-session');
const createError = require('http-errors');
const routes = require('./routes')

// Initialize the server object
const server = express();
const PORT = 3000;

// Communicate with the chaincode by create a hyperledgerApp object
const hyperledgerApp = new HyperledgerApp();

// Import UserHelper from helpers
const UserHelper = require('./helpers/UserHelper');
const userHelper = new UserHelper;

server.set('trust proxy', 1);

server.use(cookieSession({
    name: 'session',
    keys: ['Jason238497mkasns', 'asdjasni673mes345'],
}))

server.use(express.static(__dirname + '/public'));

server.use('/', routes({hyperledgerApp}));

// bodyParse setup
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());

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
server.get('/getAllCerts', async (req, res, next) => {
    try {
        const certs = await hyperledgerApp.GetAllCerts();
        return res.send(certs);
    } catch (err) {
        console.log(`Errors getting all certificates: ${err}`);
        return next(err);
    }
    
})

// An endpoint returns certificates based on the given name
server.get('/getCertByOwner', async (req, res, next) => {
    try {
        const { firstName, lastName } = req.query;

        const userExists = await userHelper.userExistsCheck(firstName, lastName);
    
        if (userExists) {
            const owner = firstName + ' ' + lastName;
    
            const certs = await hyperledgerApp.GetCertsByOwner(owner);
        
            return res.send(certs);
        } else {
            return res.send("User not found");
        }
    } catch (err) {
        console.log(`Error getting certificates by owner: ${err}`);
        return next(err);
    }
})

// An endpoint returns history of a certificate
server.get('/getCertHistory', async (req, res, next) => {
    try {
        const { certId } = req.query;

        const certHistory = await hyperledgerApp.GetCertHistory(certId);
    
        return res.send(certHistory);
    } catch (err) {
        console.log(`Error getting certificate's history: ${err}`);
        return next(err);
    }
})

server.use((req, res, next) => {
    return next(createError(404, "File not found"));
})

server.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status);
    res.send(err.message);
})

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})