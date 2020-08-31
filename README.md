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
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem # provide the CA of orderer node
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt # provide CA of peer0 of organization1
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt # provide CA of peer0 of organization2
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
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
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
These are the steps after a new configuration proto buffer (.pb) has been ready to be signed by the peers in the channel. The file `org3_update_in_envelope.pb` has been derived from configuration modifying processes. The processes were adding org3's configuration into the channel's most recent configuration block.

### - Step 1: Sign the new configuration block
Now, Peer0Org1 (Org1's admin) will sign the updated configuration (endorse this new channel configuration block):

```bash
# Make sure peer0Org1 variables are exported as CORE_PEER
peer channel signconfigtx -f org3_update_in_envelope.pb
```

### - Step 2: Update the channel configuration
Then, we also need signature from Org2. Peer0Org2 (Org2's admin) will sign and update the channel configuration at once. Updating the channel will also have the peer's signature included in the transaction:

```bash
# CORE_PEER variables should be storing peer0Org2 before execute this command
peer channel update -f org3_update_in_envelope.pb -c $CHANNEL_NAME -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
```
After successfully executing this command, Org3 should be recognized in `mychannel` configuration, however, Org3 is not in the channel yet. We still have to join its peers into the channel like we did with Org1 and Org2.

### - Step 3: Fetch genesis block to join the new organization into the channel
If any peer wants to join a channel, they have to have the channel's genesis block so that the new peer's blockchain can be updated. On Peer0Org3 (Org3's admin), fetch the genesis block of `mychannel`

```bash
peer channel fetch 0 mychannel.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```

Expect to receive block 0 in the terminal and a file `mychannel.block` is now available in the current directory.

### Step 4: Join new organization's peer to the channel
Join Org3 to the channel with the genesis block derived from the previous step:

```bash
peer channel join -b mychannel.block
```
Org3 should be now joined into `mychannel`. Check this by execute this command (on peer0Org3):
```bash
peer channel list
# mychannel should be listed in the response
```

### Step 5: Install chaincode on new organization's peer
Org3 is in the channel, however, in order for it to endorse chaincode transactions in the channel we have to have the chaincode installed and invokable on Org3's peer as well. Install the chaincode (the same chaincode installed on Org1 and Org2) onto peer0Org3 using `peer lifecycle chaincode` command:
```bash
peer lifecycle chaincode install cert.tar.gz
```
The chaincode should be now installed on peer0Org3. The channel will now require Org3 to approve the chaincode, execute this command to check commit readiness of the chaincode:
```bash
# The sequence flag from now on should be specified with 2 as we are updating the definitions of the chaincode the second time on the channel
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
    --name cert --version 1.0 --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
```
The response will show 3 Orgs with `false` values next to them. Therefore, we will approve the chaincode on all Orgs just like we did when we bring up the basic network.

### Step 6: All organizations need to approve the installed chaincode
Each organization has to approve the chaincode with the sequence flag of 2:

```bash
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
```
Execute this command on each organizations and check commit readiness again with the above command:

```bash
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
    --name cert --version 1.0 --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
```
The result should now show 3 `true`.

### - Step 7: Commit the definitions of the chaincode
Now the chaincode definitions should be ready to commit:

```bash
# Again, make sure sequence flag is 2
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME --name cert --version 1.0 --sequence 2 \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
    --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA
```
Now, the chaincode is now ready to be invoke and query.

## Problem Troubleshooting
1. If the terminal says a flag in a command is empty or cannot access `msp`, `cert` file. Check the gloabl variables if they are exported. Use this command to check global variables' value:

```bash
echo $VARIABLE_NAME
# For example: echo $CORE_PEER_LOCALMSPID should return the path to the msp file.
```

2. If the 