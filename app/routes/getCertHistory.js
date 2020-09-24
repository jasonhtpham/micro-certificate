const express = require('express');
const router = express.Router();

module.exports = params => {
    const { hyperledgerApp } = params;

    // An endpoint returns history of a certificate
    router.get('/', async (req, res, next) => {
        try {
            const { certId } = req.query;

            if (certId) {
                const certHistory = await hyperledgerApp.GetCertHistory(certId);
            
                if (JSON.parse(certHistory).length === 0) {
                    // return res.status(404, ("Certificate ID not found"));
                    const errors = { msg : "Certificate ID not found" };
                    return res.send({errors});
                }

                return res.send({certHistory});
            } else {
                const errors = { msg : "Certificate ID is required" };
                return res.send({errors});
            }

        } catch (err) {
            console.log(`Error getting certificate's history: ${err}`);
            return next(err);
        }
    })

    return router;
};