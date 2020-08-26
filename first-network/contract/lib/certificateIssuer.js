/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class CertificateIssuer extends Contract {

    async InitLedger(ctx) {
        const certs = [
            {
                ID: 'studentA725',
                UnitCode: 'SIT725',
                Grade: 50,
                Owner: 'Student A',
                Credit: 1,
            },
        ];

        for (const cert of certs) {
            cert.docType = 'certificate';
            await ctx.stub.putState(cert.ID, Buffer.from(JSON.stringify(cert)));
            console.info(`cert ${cert.ID} initialized`);
        }
    }

    // Createcert issues a new cert to the world state with given details.
    async CreateCert(ctx, id, unitcode, grade, owner, credit) {
        // Check if the certificate already exists
        const exists = await this.CertExists(ctx, id);
        if (exists) {
            throw new Error(`The certificate ${id} already exists`);
        }

        // Create the certificate and save to the state
        const cert = {
            docType: 'certificate',
            ID: id,
            UnitCode: unitcode,
            Grade: grade,
            Owner: owner,
            Credit: credit,
        };
        
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(cert)));
    }

    // Readcert returns the cert stored in the world state with given id.
    async ReadCert(ctx, id) {
        const certJSON = await ctx.stub.getState(id); // get the cert from chaincode state
        if (!certJSON || certJSON.length === 0) {
            throw new Error(`The cert ${id} does not exist`);
        }
        return certJSON.toString();
    }

    // Updatecert updates an existing cert in the world state with provided parameters.
    async UpdateCert(ctx, id, unitcode, grade, owner, credit) {
        const exists = await this.CertExists(ctx, id);
        if (!exists) {
            throw new Error(`The cert ${id} does not exist`);
        }

        // overwriting original cert with new cert
        const updatedCert = {
            ID: id,
            UnitCode: unitcode,
            Grade: grade,
            Owner: owner,
            Credit: credit,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedCert)));
    }
    

    // Deletecert deletes an given cert from the world state.
    async DeleteCert(ctx, id) {
        const exists = await this.CertExists(ctx, id);
        if (!exists) {
            throw new Error(`The cert ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // certExists returns true when cert with given ID exists in world state.
    async CertExists(ctx, id) {
        const certJSON = await ctx.stub.getState(id);
        return certJSON && certJSON.length > 0;
    }

    // Transfercert updates the owner field of cert with given id in the world state.
    async TransferCert(ctx, id, newOwner) {
        const certString = await this.ReadCert(ctx, id);
        const cert = JSON.parse(certString);
        if (cert.Owner == newOwner) {
            throw new Error('The student already had this certificate');
        }
        cert.Owner = newOwner;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(cert)));
    }

    // GetCertHistory returns the chain of custody for a certificate since its issuance
    async GetCertHistory(ctx, id) {
        let resultsIterator = await ctx.stub.getHistoryForKey(id);
        let result = await this.GetAllResults(resultsIterator, true);

        return JSON.stringify(result);
    }

    // QueryCertsByOwner queries for certificates by owner
    // This will use parameterized query which is only supported
    // by some databases, such as CouchDB.
    async QueryCertsByOwner(ctx, owner) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'certificate';
        queryString.selector.Owner = owner;

        let queryResults = await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
        
        return queryResults;
    }

    // GetQuueryResultForQueryString is a supporting function executing the queryString passed into it
    // Result set is built and returned as a byte array containing the JSON results
    async GetQueryResultForQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        console.log(resultsIterator);
        let result = await this.GetAllResults(resultsIterator, false);
        
        return JSON.stringify(result);
    }

    async GetAllCerts(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('','');
        let result = await iterator.next();

        while (!result.done) {
            let jsonResult = {};
            try {
                jsonResult.Record = JSON.parse(result.value.value.toString('utf8'));
            } catch (err) {
                console.log(err);
                jsonResult.Record = result.value.value.toString('utf8');
            }
            jsonResult.Key = result.value.key;

            allResults.push(jsonResult);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // GetAllResults returns all certs found in the world state.
    async GetAllResults(iterator, historyWanted) {
        let allResults = [];
       
        while (true) {
            let result = await iterator.next();

            if (result.value && result.value.value.toString()){
                let jsonResult = {};

                // Execute this if the caller is GetCertHistory
                if (historyWanted) {
                    jsonResult.TxId = result.value.tx_id;
                    jsonResult.TimeStamp = result.value.timestamp;
                    try {
                        jsonResult.Value = JSON.parse(result.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonResult.Value = result.value.value.toString('utf8');
                    }
                }

                // Execute this if the caller is other functions
                if (!historyWanted) {
                    jsonResult.Key = result.value.key;
                    try {
                        jsonResult.Record = JSON.parse(result.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonResult.Record = result.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonResult);
            }
            if (result.done) {
                await iterator.close();
                return allResults;
            }
        }
    }
}

module.exports = CertificateIssuer;
