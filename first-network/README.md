# Hyperledger Micro Certificates

A micro certificates issuing application based on Hyperledger Fabric

## Prerequisites

There are some tools needed.
- Docker (docker-compose).
- curl.
- Add bin directory into system bash (so we can use those binary to interact with fabric).

## Bring up the basic Hyperledger network

### - Step 1: start dockers
In the `first-network` directory, run the following command:

```bash
# Bring up a basic network with 2 organizations
docker-compose up -d
```
---
**Step 2 to 8 are done using the script `./createChannel.sh`**  
_Those steps can be followed to do the same thing, but using the script is more time-saving. Therefore, the follwing steps are created with explanation purpose_
---

### - Step 2: create channel
Firstly, we need to set some global variables that we need to use along the way:
```bash
export CORE_PEER_TLS_ENABLED=true # enable TLS connection
export ORDERER_CA=${PWD}/crypto-output/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem # provide the CA of orderer node
export PEER0_ORG1_CA=${PWD}/crypto-output/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt # provide CA of peer0 of organization1
export PEER0_ORG2_CA=${PWD}/crypto-output/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt # provide CA of peer0 of organization2
export FABRIC_CFG_PATH=${PWD}/ # provide the path where the core.yaml file is located - core.yaml file tells the network nodes how to communicate with each other
export CHANNEL_NAME=mychannel # name of the channel
```

Follow these commands to create the channel:

```bash
# Create channel
peer channel create -o localhost:7050 -c $CHANNEL_NAME \
    --ordererTLSHostnameOverride orderer.example.com \
    -f ./channel-artefacts/${CHANNEL_NAME}.tx --outputBlock ./channel/${CHANNEL_NAME}.block \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
```
We should have a channel block `mychannel.block` stored in the channel directory, it is a genesis block of `mychannel` channel

### - Step 3: join peers
Now, we can join the peers to the created channel. We need to set some variables again:

```bash
# Set variables of peer0Org1 to be the core peer
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```
After settings those variables, we are now commanding as peer0.org1 (i.e. we are in the peer0.org1's bash CLI). Therefore, we can now join peer0.org1 to the channel using the following command:
```bash
peer channel join -b ./channel/$CHANNEL_NAME.block
```
Repeat the same procedures to join other peers to the channel.

### - Step 4: update anchor peers
Then, we need to tell the channel about our anchor peers. Make sure the global variables are set correctly like above (assuming we are in peer0.Org1):
```bash
peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artefacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
```
Repeat the same procedures to update other organizations' anchor peers.

---
Up to this step, we should have a channel with 2 organizations org1 and org2 joined with their peers. Next steps will install the chaincode on peers.  
These steps are executed using mostly `peer lifecycle chaincode` commands and some `peer chaincode` commands. Find out more [here](https://hyperledger-fabric.readthedocs.io/en/release-2.0/commands/peerlifecycle.html).
---

### - Step 5: Package the chaincode
We should package our chaincode for easy instalation. This can be done by any peer.

```bash
peer lifecycle chaincode package cert.tar.gz --path ./contract --lang node --label cert_1
```
We should have a `cert.tar.gz` file created in the current directory.
### - Step 6: install chaincode on peers
Now, we have a chaincode package ready to be installed. Again, make sure we are in correct peer's bash CLI by exporting correct variables to install chaincode (assuming we are in peer0.Org1):

```bash
peer lifecycle chaincode install cert.tar.gz
```
Set other peers' variables as CORE_PEER and repeat the same command to install chaincode on them. Once chaincode is installed successfully on all peers, a package identifier (Package ID) is returned. Store that ID in a variable call PACKAGE_ID, so that we can use it later:
```bash
export PACKAGE_ID=cc_version:<random id string>
```

### - Step 7: approve the installed chaincode
All organizations on the channel have to approve the chaincode before it can be committed. Therefore, on each peer, approve the chaincode using following command:

```bash
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 1 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
```

Make sure we execute above command successfully for each organization, we can also check if all organizations have approved by execute this command on any organization:
```bash
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
    --name cert --version 1.0 --sequence 1 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
```
If the chaincode is ready to commit (all organizations approved or major organizations approved depends on the endorsement policy). We can go to the next step and commit the chaincode.

### - Step 8: commit approved chaincode
Chaincode can be commited by any approved organizations. Approving it using this command:

```bash
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME --name cert --version 1.0 --sequence 1 \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
```
After successful commiting chaincode, the chaincode is ready to be invoked/queried.  
_Open another terminal, run `docker ps`, we should have new containers named with chaincode package id and peer address up and running (something looks like this `peer0.org1.example.com-cert_1-4e5c7f67368877f7be32711ff0a7b302d3d701620ca7c2305457f9f784acae4f`)_

### - Step 9: chaincode is ready to be invoked
Chaincode is now ready to be invoked and queried using `peer chaincode` command ([find out more](https://hyperledger-fabric.readthedocs.io/en/release-2.0/commands/peerchaincode.html#peer-chaincode-invoke)):

```bash
peer chaincode invoke -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    -C mychannel -n cert \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    -c '{"Args":["GetAllCerts"]}'
```
We now have a basic network with 2 organizations up and running. Next section will look into adding a new organization into the channel.

## Adding new organization using configtxlator

## Problem Troubleshooting
```python
import foobar

foobar.pluralize('word') # returns 'words'
foobar.pluralize('goose') # returns 'geese'
foobar.singularize('phenomena') # returns 'phenomenon'
```