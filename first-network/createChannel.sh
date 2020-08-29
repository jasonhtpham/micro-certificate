echo "===== Set global variables ====="
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/crypto-output/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/crypto-output/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/crypto-output/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export PEER0_ORG3_CA=${PWD}/org3-materials/crypto-config/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/
export CHANNEL_NAME=mychannel

# setGlobalsForOrderer(){
#     export CORE_PEER_LOCALMSPID="OrdererMSP"
#     export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/crypto-output/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
#     export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/ordererOrganizations/example.com/users/Admin@example.com/msp
    
# }

setGlobalsForPeer0Org1(){
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setGlobalsForPeer1Org1(){
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    
}

setGlobalsForPeer0Org2(){
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051

}

setGlobalsForPeer1Org2(){
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-output/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:10051
    
}

# setGlobalsForPeer0Org3(){
# export CORE_PEER_LOCALMSPID="Org3MSP"
# export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
# export CORE_PEER_MSPCONFIGPATH=${PWD}/org3-materials/crypto-config/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
# export CORE_PEER_ADDRESS=localhost:11051
# }

createChannel(){
    rm -rf ./channel/*
    setGlobalsForPeer0Org1
    
    echo "===== Creating Channel ====="
    peer channel create -o localhost:7050 -c $CHANNEL_NAME \
    --ordererTLSHostnameOverride orderer.example.com \
    -f ./channel-artefacts/${CHANNEL_NAME}.tx --outputBlock ./channel/${CHANNEL_NAME}.block \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    echo "===== Channel Created ====="

}

removeOldCrypto(){
    rm -rf ./api-1.4/crypto/*
    rm -rf ./api-1.4/fabric-client-kv-org1/*
    rm -rf ./api-2.0/org1-wallet/*
    rm -rf ./api-2.0/org2-wallet/*
}

joinChannel(){
    echo "===== Joining Channel ====="
    setGlobalsForPeer0Org1
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
    setGlobalsForPeer1Org1
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
    setGlobalsForPeer0Org2
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
    echo "===== Channel Joined ====="

#    setGlobalsForPeer1Org2
#    peer channel join -b ./channel/$CHANNEL_NAME.block
    
}

updateAnchorPeers(){
    setGlobalsForPeer0Org1
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artefacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    
    setGlobalsForPeer0Org2
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artefacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    
    echo "===== Anchor Peers Updated! ====="
}

# removeOldCrypto

createChannel
joinChannel
updateAnchorPeers

CHANNEL_NAME="mychannel"
CC_RUNTIME_LANGUAGE="node"
CC_SRC_PATH="./contract"
CC_NAME="cert"

PackageChaincode() {
    echo "===== Packaging chaincode ====="
    setGlobalsForPeer0Org1

    peer lifecycle chaincode package cert.tar.gz --path ./contract --lang node --label cert_1
}


InstallChaincode() {
    echo "===== Install CC on peer0.Org1 ====="
    setGlobalsForPeer0Org1
    peer lifecycle chaincode install cert.tar.gz

    echo "===== Install CC on peer0.Org2 ====="
    setGlobalsForPeer0Org2
    peer lifecycle chaincode install cert.tar.gz
}


CheckCommitReadiness () {
    peer lifecycle chaincode checkcommitreadiness --channelID mychannel \
    --name cert --version 1.0 --sequence 1 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
}

ApproveChaincode () {
    setGlobalsForPeer0Org1

    #Query Installed cc to get PACKAGE_ID
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)

    # Approve cc on peer0Org1
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 1 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

    echo "CC is approved by peer0.Org1.example.com"
    # Check commit readiness on Org1
    echo "===================== checking commit readyness from org 1 ===================== "
    CheckCommitReadiness

    # Approve cc on peer0Org2
    setGlobalsForPeer0Org2

    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID mychannel --name cert --version 1.0 \
    --package-id $PACKAGE_ID --sequence 1 \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    echo "CC is approved by peer0.Org2.example.com"
    # Check commit readiness on Org2
    echo "===================== checking commit readyness from org 2 ===================== "
    CheckCommitReadiness
}

CommitChaincode () {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    --channelID mychannel --name cert --version 1.0 --sequence 1 \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA
    echo "==================== Committing Chaincode ===================="
    peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA
}

# PackageChaincode
InstallChaincode
ApproveChaincode
CommitChaincode

# Package chaincode
# peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}
# peer lifecycle chaincode package cert.tar.gz --path ./contract --lang node --label cert_1

# Install chaincode on desire peer
# peer lifecycle chaincode install ${packaged_chaincode.tar.gz file}
# peer lifecycle chaincode install cert.tar.gz

# Query installed chaincode on a peer
# peer lifecycle chaincode queryinstalled

# Approve chaincode - needs to be executed on ALL ORGS
# peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
# --channelID mychannel --name cert --version 2.0 \
# --package-id $PACKAGE_ID --sequence 1 \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
# --channel-config-policy Channel/Application/Endorsement

# Check commit readiness after approving cc
# peer lifecycle chaincode checkcommitreadiness --channelID mychannel \
# --name cert --version 1.0 --sequence 1 \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json

# Commit chaincode
# peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
# --channelID mychannel --name cert --version 1.0 --sequence 1 \
# --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
# --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
# --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA

# Query commited chaincode
# peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA

# Invoke chaincode
# peer chaincode invoke -o localhost:7050 \
# --ordererTLSHostnameOverride orderer.example.com \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
# -C mychannel -n cert \
# --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
# --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
# --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
# -c '{"Args":["GetAllCerts"]}'


# peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
# --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
# -C mychannel -n fabcar \
# --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
# --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
# -c '{"function":"createCar","Args":["CAR11","Honda","Accord","Black","Tom"]}'

# ======================================================================================

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

# Peer0Org1 (Org1's admin) signs the update information
# peer channel signconfigtx -f org3_update_in_envelope.pb

# Peer0Org2 (Org2's admin) signs and updates the channel configuration
# peer channel update -f org3_update_in_envelope.pb -c $CHANNEL_NAME -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

# On Peer0Org3 (Org3's admin), fetch the genesis block of the channel wanted to join
# peer channel fetch 0 mychannel.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME --tls --cafile $ORDERER_CA

# Join Org3 to the channel with the genesis block
# peer channel join -b mychannel.block

# Install chaincode onto the peers of all orgs (admin peers)
# peer chaincode install -n cert -v 2.0 -l node -p ./contract

# Upgrade the chaincode to the channel -> include Org3 in the endorsement policies -> leverage Org3's members to endorse transactions
# peer chaincode upgrade -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n cert -v 2.0 -c '{"Args":["InitLedger"]}' -P "OR ('Org1MSP.member','Org2MSP.member','Org3MSP.member')"

# peer chaincode upgrade -o orderer.example.com:7050 --tls --cafile $ORDERER_CA -C mychannel -n mycc -v 1.2 -c '{"Args":["init","a","100","b","200","c","300"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')"
