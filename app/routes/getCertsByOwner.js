const express = require('express');
const router = express.Router();

// Import UserHelper from helpers
const UserHelper = require('../helpers/UserHelper');
const userHelper = new UserHelper;

module.exports = params => {
    const { hyperledgerApp } = params;

    // An endpoint returns certificates based on the given name
    router.get('/', async (req, res, next) => {
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

    return router;
};