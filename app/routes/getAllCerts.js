const express = require('express');
const router = express.Router();

const bodyParser = require ('body-parser');


// bodyParse setup
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

module.exports = params => {
    const { hyperledgerApp } = params

    // An endpoint returns all certificates on the ledger
    router.get('/', async (req, res, next) => {
        try {
            const certs = await hyperledgerApp.GetAllCerts();
            return res.send(certs);
        } catch (err) {
            console.log(`Errors getting all certificates: ${err}`);
            return next(err);
        }
    })

    return router;
};