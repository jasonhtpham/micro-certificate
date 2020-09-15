const express = require('express');
const { check, validator, validationResult } = require('express-validator');
const bodyParser = require ('body-parser');


const router = express.Router();

// bodyParse setup
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

// Import UserHelper from helpers
const UserHelper = require('../helpers/UserHelper');
const userHelper = new UserHelper;

const validations = [
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
];

/**
 * @description Produces an certificate ID which will be saved as Key in ledger database.
 * 
 * @param {string} firstName first name of the user. The parameter is derived from user's input in frontend forms.
 * @param {string} lastName last name of the user. The parameter is derived from user's input in frontend forms.
 * @param {string} unitCode unit code which the certificate certifies the user has completed. The parameter is derived from user's input in frontend forms.
 * 
 * @returns {string} A certificate string derived from the combination of the 3 params.
 */
const produceCertId = (firstName, lastName, unitCode) => {
    // certID = first name + last name + last 3 digits from the unitCode
    const processedFirstName = firstName.trim().toLowerCase();
    const processedLastName = lastName.trim().toLowerCase();
    const processedUnitCode = unitCode.substring(3);

    const certId = processedFirstName + processedLastName + processedUnitCode;
    
    return certId;
}

module.exports = params => {
    const { hyperledgerApp } = params;

    // Create certificates with information filled in the form
    router.post('/', validations, async (req, res, next) => {
        try {
            // Check user's input to ensure data is clean
            const errors = validationResult(req);
            const result = {};
    
            // console.log({errors});

            if (!errors.isEmpty()) {
                req.session.createCert = {
                    errors : errors.array(),
                };
                result.errors = errors.array();
                return res.send(result);
            }

            // =====================================
            const { firstName, lastName, unitCode, grade, credit } = req.body;

            // Check if entered user exists (registered)            
    
            const userExists = await userHelper.userExistsCheck(firstName, lastName);
            
            // Execute the transaction if the user does exist
            if (userExists) {
                const certId = produceCertId(firstName, lastName, unitCode);
    
                const owner = firstName + ' ' + lastName;
    
                // Receive response from the contract => check whether successful payload OR errors.
                const contractResponse = await hyperledgerApp.CreateCert(certId, unitCode, grade, owner, credit);
                
                // Send the information of certificate if the transaction is successfull
                if (!contractResponse.errors) {
                    result.sucess = certId;
                    return res.send(result);
                } 
                
                // Display error if the transaction is NOT successfull
                if (contractResponse.errors) {
                    // console.log(contractResponse.responses[0].response.message);
                    let errorMessages = [];
    
                    // Get error messages from the responses of peers
                    contractResponse.responses.forEach(peerResponse => {
                        const transactionErrors = {
                            msg : peerResponse.response.message,
                        };
                            errorMessages.push(transactionErrors);
                    })
    
                    req.session.createCert = {
                        errors : errorMessages,
                    };
                    result.errors = errorMessages;
                    return res.send(result);
                }
            } 
            
            // Display an error if the entered user does NOT exist (not registered)
            if (!userExists) {
                const userNotExistsError = [ { msg: "User not found"} ];
                req.session.createCert = {
                    errors : userNotExistsError,
                };
                result.errors = userNotExistsError;
                return res.send(result);
            }
        } catch (err) {
            console.log(`There is an error on create certificate endpoint: ${err}`);
            return next(err);
        }
    });

    router.get('/', (req, res, next) => {
        try {
            // console.log(req.session.createCert);
            const errors = req.session.createCert ? req.session.createCert.errors : false;
            req.session.createCert = {};
    
            return res.send(errors);
        } catch (err) {
            console.log(`Error displaying error messages for create cert: ${err}`);
            return next(err);
        }
    });

    return router;
};