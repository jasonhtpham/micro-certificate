'use strict';

const {Gateway, Wallets} = require('fabric-network');
const path = require('path');
const fs = require('fs');
const registerUser = require('./registerUser');
const enrollAdmin = require('./enrollAdmin');

const myChannel = 'mychannel';
const myChaincodeName = 'cert';

let wallet;
let contract;

const prettyJSONString = (inputString) => {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

// pre-requisites:
// fabric-sample test-network setup with two peers and an ordering service,
// the companion chaincode is deployed, approved and committed on the channel mychannel
class HyperledgerApp {
    constructor() {
        this.InitLedger();
    }

    InitLedger = async () => {
        try {
            if (!wallet) {
                // load the network configuration
                const ccpPath = path.resolve(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
                const fileExists = fs.existsSync(ccpPath);
                if (!fileExists) {
                    throw new Error(`no such file or directory: ${ccpPath}`);
                }
                const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
                // Create a new file system based wallet for managing identities.
                const walletPath = path.join(__dirname, 'wallet');
                wallet = await Wallets.newFileSystemWallet(walletPath);
                console.log(`Wallet path: ${walletPath}`);
        
        
                // 1. register & enroll admin user with CA, stores admin identity in local wallet
                await enrollAdmin.EnrollAdminUser();
        
                // 2. register & enroll application user with CA, which is used as client identify to make chaincode calls, stores app user identity in local wallet
                await registerUser.RegisterAppUser();
        
                // Check to see if app user exist in wallet.
                const identity = await wallet.get(registerUser.ApplicationUserId);
                if (!identity) {
                    console.log(`An identity for the user does not exist in the wallet: ${registerUser.ApplicationUserId}`);
                    return;
                }
        
                //3. Prepare to call chaincode using fabric javascript node sdk
                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccp, {
                    wallet,
                    identity: registerUser.ApplicationUserId,
                    discovery: {enabled: true, asLocalhost: true}
                });
                try {
                    // Get the network (channel) our contract is deployed to.
                    const network = await gateway.getNetwork(myChannel);
        
                    // Get the contract from the network.
                    contract = network.getContract(myChaincodeName);

                    // Initialize the chaincode by calling its InitLedger function
                    // console.log('Submit Transaction: InitLedger to create the very first cert');
                    // await contract.submitTransaction('InitLedger');
                } catch (err) {
                    console.log(err);
                }
            }

            if (wallet && contract) {
                console.log('Chaincode is ready to be invoked');
            } else {
                throw new Error("Cannot connect with Fabric")
            }
        } catch (err) {
            console.log(err);
        }
    }

    GetAllCerts = async () => {
        // Get the certificates stored on ledger
        try {
            let result = await contract.evaluateTransaction('GetAllCerts');
            return prettyJSONString(result.toString());
        } catch (err) {
            console.log(`Error when get all certificates: ${err}`);
        }
    }

    CreateCert = async (id, unitCode, mark, owner, credit, period) => {
        console.log('Submit Transaction: CreateCert() Create a new certificate');
        try {
            // Return the successful payload if the transaction is committed without errors
            const result = await contract.submitTransaction('CreateCert', id, unitCode, mark, owner, credit, period);
            return prettyJSONString(result.toString());
        } catch (err) {
            console.log(`Error when create certificate: ${err}`);

            // Return errors if any
            return err;
        }
    }

    GetCertsByOwner = async (owner) => {
        // Query certs by owner
        console.log('Evaluate Transaction: QueryCertsByOwner()');
        try {
            const result = await contract.evaluateTransaction('QueryCertsByOwner', owner);
            return prettyJSONString(result.toString());
        } catch (err) {
            console.log(`Error when get certificates by owner: ${err}`);
        }
    }

    GetCertHistory = async (certId) => {
        console.log('Evaluate Transaction: GetCertHistory()');
        try {
            const result = await contract.evaluateTransaction('GetCertHistory', certId);
            return prettyJSONString(result.toString());
        } catch (err) {
            console.log(`Error when get certificate's history': ${err}`);
        }
    }

    UpdateCert = async (id, unitCode, mark, owner, credit) => {
        console.log('Submit Transaction: UpdateCert() Update certificate');
        try {
            // Return the successful payload if the transaction is committed without errors
            const result = await contract.submitTransaction('UpdateCert', id, unitCode, mark, owner, credit);
            return prettyJSONString(result.toString());
        } catch (err) {
            console.log(`Error when create certificate: ${err}`);

            // Return errors if any
            return err;
        }
    }
}

module.exports = HyperledgerApp;





// Legacy test codes
    /*
            // Get the certificates stored on ledger
            console.log('\nEvaluate Transaction: ReadCert() with id:studentA430 to check if the cert is issued')
            result = await contract.evaluateTransaction('ReadCert', 'studentA430');
            console.log(`\nresult: ${prettyJSONString(result.toString())}`)

            console.log('\n***********************');

            // Query certs by owner
            console.log('\nEvaluate Transaction: QueryCertsByOwner() with owner:studentA')
            result = await contract.evaluateTransaction('QueryCertsByOwner', 'studentA');
            console.log(`\nCerts of StudentA: ${prettyJSONString(result.toString())}`);

            console.log('\nEvaluate Transaction: QueryCertsByOwner() with owner:studentB')
            result = await contract.evaluateTransaction('QueryCertsByOwner', 'studentB');
            console.log(`\nCerts of StudentB: ${prettyJSONString(result.toString())}`);

            console.log('\n***********************');

            // GetCertHistory to view a certificate's history since creation
            console.log('\nEvaluate Transaction: GetCertHistory()');
            result = await contract.evaluateTransaction('GetCertHistory', 'studentA725');
            console.log(`\nHistory of certificate studentA725: ${prettyJSONString(result.toString())}`);

            // try {
            //     console.log('\nSubmit Transaction: TransferCert SIT725 to its owner');
            //     //Non existing asset asset70 should throw Error
            //     await contract.submitTransaction('TransferCert', 'SIT725', 'Jason');
            // } catch (error) {
            //     console.log(`Expected an error on TransferCert of non-existing Asset: ${error}`);
            // }

        } finally {
            // Disconnect from the gateway peer when all work for this client identity is complete
            gateway.disconnect();
        }
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}


main();
*/