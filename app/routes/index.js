const express = require('express');
const router = express.Router();

const createCertRoute = require('./createCert');
const getAllCertsRoute = require('./getAllCerts');
const getCertHistoryRoute = require('./getCertHistory');
const getCertsByOwnerRoute = require('./getCertsByOwner');
const updateCertRoute = require('./updateCert');


// Import UserHelper from helpers
const UserHelper = require('../helpers/UserHelper');
const userHelper = new UserHelper;

module.exports = params => {
    router.get('/registeredUsers', async (req, res, next) => {
        try {
            const usersList = await userHelper.getUsersList();
            // lastUpdateEntries = users.length;
            
            return res.send(usersList);
    
        } catch (err) {
            console.log(`Problems on users retrieving endpoint ${err}`);
            return next(err);
        }
    });

    router.use('/createCert', createCertRoute(params));
    router.use('/getAllCerts', getAllCertsRoute(params));
    router.use('/getCertHistory', getCertHistoryRoute(params));
    router.use('/getCertsByOwner', getCertsByOwnerRoute(params));
    router.use('/updateCert', updateCertRoute(params));


    return router;
};





// Get new added users from the database
/*
const newUsers = await client.db("firstdb").collection("Users").find().skip(parseInt(lastUpdateEntries)).toArray();
    if (newUsers) {
        lastUpdateEntries += newUsers.length;
        res.send(newUsers);
    }
    res.end()
*/