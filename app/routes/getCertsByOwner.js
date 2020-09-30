const express = require('express');
const router = express.Router();
const bodyParser = require ('body-parser');


// bodyParse setup
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

// Import UserHelper from helpers
const UserHelper = require('../helpers/UserHelper');
const userHelper = new UserHelper;

module.exports = params => {
    const { hyperledgerApp } = params;

    // An endpoint returns certificates based on the given name
    router.get('/', async (req, res, next) => {
        try {
            const { studentID, firstName, lastName } = req.query;

            const userExists = await userHelper.userExistsCheck(firstName, lastName);
        
            if (userExists) {
                const studentName = firstName + ' ' + lastName;
        
                const certs = await hyperledgerApp.GetCertsByOwner(studentName, studentID);
            
                return res.send({certs});
            } else {
                const errors = [{ msg : "User not found" }];
                return res.status(404).send({errors});
            }
        } catch (err) {
            console.log(`Error getting certificates by owner: ${err}`);
            return next(err);
        }
    })

    return router;
};