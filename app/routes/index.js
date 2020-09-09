const express = require('express');
const router = express.Router();

const createCertRoute = require('./createCert');

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

    return router;
};