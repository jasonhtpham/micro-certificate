# Adding an org

# Fetch most recent config block
# peer channel fetch config config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME --tls --cafile $ORDERER_CA

# Convert config block into json
# configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json
# OR
# curl -X POST --data-binary @config_block.pb "$CONFIGTXLATOR_URL/protolator/decode/common.Block" | jq .data.data[0].payload.data.config > config_block.json

# Add org3 MSP info into the channel config
# jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' config.json ./channel-artefacts/org3.json > modified_config.json

# Re-decode the json files to calculate delta
# config.json
# configtxlator proto_encode --input config.json --type common.Config --output config.pb
# OR
# curl -X POST --data-binary @config.json "$CONFIGTXLATOR_URL/protolator/encode/common.Config" > config.pb
# modified_config.json
# configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
# OR
# curl -X POST --data-binary @modified_config.json "$CONFIGTXLATOR_URL/protolator/encode/common.Config" > modified_config.pb

# Calculate the delta
# configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_config.pb --output org3_update.pb
# OR
# curl -X POST -F channel=$CHANNEL_NAME -F "original=@config.pb" -F "updated=@modified_config.pb" "${CONFIGTXLATOR_URL}/configtxlator/compute/update-from-configs" > org3_update.pb

# Parse the delta file back into JSON to wrap it with the header
# configtxlator proto_decode --input org3_update.pb --type common.ConfigUpdate | jq . > org3_update.json
# OR
# curl -X POST --data-binary @org3_update.pb "$CONFIGTXLATOR_URL/protolator/decode/common.ConfigUpdate" | jq . > org3_update.json

# Wrap the JSON file wit header
# echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat org3_update.json)'}}}' | jq . > org3_update_in_envelope.json

# Encode the envelope back into .pb format
# configtxlator proto_encode --input org3_update_in_envelope.json --type common.Envelope --output org3_update_in_envelope.pb
# OR
# curl -X POST --data-binary @org3_update_in_envelope.json "$CONFIGTXLATOR_URL/protolator/encode/common.Envelope" > org3_update_in_envelope.pb

# ===========================================================================================================

# Remove the old channel's genesis block if there is one
if [[ -e "mychannel.block" ]]; then
    rm mychannel.block
fi

echo "===== Set global variables ====="
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export PEER0_ORG3_CA=${PWD}/org3-materials/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/
export CHANNEL_NAME=mychannel

setGlobalsForPeer0Org1(){
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setGlobalsForPeer0Org2(){
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051

}

setGlobalsForPeer0Org3(){
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/org3-materials/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
}

# Peer0Org1 (Org1's admin) signs the update information
echo "===== Org1 signing new config ====="
setGlobalsForPeer0Org1
peer channel signconfigtx -f org3_update_in_envelope.pb


# Peer0Org2 (Org2's admin) signs and updates the channel configuration
echo "===== Org2 signing and updating new config ====="
setGlobalsForPeer0Org2
peer channel update -f org3_update_in_envelope.pb -c $CHANNEL_NAME -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

# On Peer0Org3 (Org3's admin), fetch the genesis block of the channel wanted to join
echo "===== Fetching channel's genesis block ====="
setGlobalsForPeer0Org3
peer channel fetch 0 mychannel.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME --tls --cafile $ORDERER_CA

# Join Org3 to the channel with the genesis block
echo "===== Joining Org3 to channel ====="
peer channel join -b mychannel.block

sleep 5

# Install chaincode for Org3 and commit new chaincode definitions to channel
CC_NAME="cert"
VERSION="1"

InstallChaincode() {
    echo "===== Install CC on peer0.Org3 ====="
    setGlobalsForPeer0Org3
    peer lifecycle chaincode install cert.tar.gz
}


CheckCommitReadiness () {
    peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
    --name cert --version 1.0 --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
}

ApproveChaincode () {
    # Approve cc on peer0Org3
    setGlobalsForPeer0Org3
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)

    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    echo "CC is approved by peer0.Org3.example.com"
    # Check commit readiness on Org3
    echo "===================== checking commit readiness ===================== "
    CheckCommitReadiness

    # Approve cc on peer0Org2
    setGlobalsForPeer0Org2
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    echo "CC is approved by peer0.Org2.example.com"
    # Check commit readiness on Org2
    echo "===================== checking commit readiness ===================== "
    CheckCommitReadiness

    # Approve cc on peer0Org1
    setGlobalsForPeer0Org1
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 2 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    echo "CC is approved by peer0.Org2.example.com"
    # Check commit readiness on Org2
    echo "===================== checking commit readiness ===================== "
    CheckCommitReadiness
}

CommitChaincode () {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME --name cert --version 1.0 --sequence 2 \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA
    echo "==================== Committing Chaincode ===================="
    peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA
}

InstallChaincode
sleep 5 # pause for 5s before moving on
ApproveChaincode
sleep 5
CommitChaincode
sleep 2

# Invoke chaincode
echo "====== Invoking chaincode ======"
peer chaincode invoke -o localhost:7050 \
--ordererTLSHostnameOverride orderer.example.com \
--tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
-C $CHANNEL_NAME -n cert \
--peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
--peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
--peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
-c '{"Args":[]}'