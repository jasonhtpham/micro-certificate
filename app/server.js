const express = require('express');
const HyperledgerApp = require('./hyperledgerApp.js');
const { IdentityProviderRegistry } = require('fabric-network');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require ('body-parser');
const path = require('path');
const { check, validator, validationResult } = require('express-validator');
const cookieSession = require('cookie-session');
const createError = require('http-errors');


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

server.get('/', (req, res) => {
    res.sendFile('./public/index.html');
})


// let lastUpdateEntries = 0; used for updating new added users

server.get('/registeredUsers', async (req, res, next) => {
    try {
        await client.connect();
        const usersList = await getUsersList();
        // lastUpdateEntries = users.length;
        
        return res.send(usersList);

    } catch (err) {
        console.log(`Problems on users retrieving endpoint ${err}`);
        return next(err);
    }
})

const getUsersList = async () => {
    try {
        const usersList = await client.db("firstdb").collection("Users").find({}).toArray();

        if (!usersList) {
            throw new Error ("Nothing found from database");
        }

        return usersList;
    } catch (err) {
        console.log(`Problems getting users from database ${err}`);
    } 
}

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

// produce the certId to be stored on the ledger
const produceCertId = (firstName, lastName, unitCode) => {
    // certID = first name + last name + last 3 digits from the unitCode
    const processedFirstName = firstName.trim().toLowerCase();
    const processedLastName = lastName.trim().toLowerCase();
    const processedUnitCode = unitCode.substring(3);

    const certId = processedFirstName + processedLastName + processedUnitCode;
    
    return certId;
}

const userExistsCheck = async (firstName, lastName) => {
    try {
        await client.connect();

        const firstNameExists = await client.db("firstdb").collection("Users").find( {"firstName" : firstName} ).toArray();
        const lastNameExists = await client.db("firstdb").collection("Users").find( {"lastName" : lastName} ).toArray();

        if ((firstNameExists.length !== 0) && 
            (lastNameExists.length !== 0) && 
            (firstNameExists[0]._id.toString() === lastNameExists[0]._id.toString()) ) {
            return true;
        } else {
            return false;
        }

    } catch (err) {
        console.log(`Errors checking user existence: ${err}`);
    }   
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
    ], async (req, res, next) => {
        try {

            // Check user's input to ensure data is clean
            const errors = validationResult(req);
            const result = {};
    
            if (!errors.isEmpty()) {
                req.session.createCert = {
                    errors : errors.array(),
                };
                result.error = 'Errors!';
                return res.send(result);
            }

            // =====================================
            const { firstName, lastName, unitCode, grade, credit } = req.body;

            // Check if entered user exists (registered)            
    
            const userExists = await userExistsCheck(firstName, lastName);
            
            // Execute the transaction if the user does exist
            if (userExists) {
                const certId = produceCertId(firstName, lastName, unitCode);
    
                const owner = firstName + ' ' + lastName;
    
                // Receive response from the contract => check whether successful payload OR errors.
                const contractResponse = await hyperledgerApp.CreateCert(certId, unitCode, grade, owner, credit);
                
                // Send the information of certificate if the transaction is successfull
                if (!contractResponse.errors) {
                    result.certId = certId;
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
                    result.error = 'Errors!';
                    return res.send(result);
                }
            } 
            
            // Display an error if the entered user does NOT exist (not registered)
            if (!userExists) {
                const userNotExistsError = [ { msg: "User not found"} ];
                req.session.createCert = {
                    errors : userNotExistsError,
                };
                result.error = 'Errors!';
                return res.send(result);
            }
        } catch (err) {
            console.log(`There is an error on create certificate endpoint: ${err}`);
            return next (err);
        }
    }
)

// An endpoint to return a confirmation of a created certificate
server.get('/createCert', (req, res, next) => {
    try {
        // console.log(req.session.createCert);
        const errors = req.session.createCert ? req.session.createCert.errors : false;
        req.session.createCert = {};

        return res.send(errors);
    } catch (err) {
        console.log(`Error displaying error messages for create cert: ${err}`);
        return next(err);
    }
})

// An endpoint returns certificates based on the given name
server.get('/getCertByOwner', async (req, res, next) => {
    try {
        const { firstName, lastName } = req.query;

        const userExists = await userExistsCheck(firstName, lastName);
    
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