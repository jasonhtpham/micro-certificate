setGlobals() {
    echo "===== Set global variables ====="
    export CORE_PEER_TLS_ENABLED=true
    export ORDERER_CA=${PWD}/crypto-output/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
    export PEER0_ORG1_CA=${PWD}/crypto-output/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export PEER0_ORG2_CA=${PWD}/crypto-output/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export FABRIC_CFG_PATH=${PWD}/
    export CHANNEL_NAME=mychannel
}

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

setGlobals
createChannel
joinChannel
updateAnchorPeers

CHANNEL_NAME="mychannel"
CC_RUNTIME_LANGUAGE="node"
VERSION="1"
CC_SRC_PATH="./contract"
CC_NAME="cert"


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

    # Approve cc on peer0Org1
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
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
    echo "==================== Committing Chaincode ===================="
    peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA
}

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
# --channelID mychannel --name cert --version 1.0 \
# --package-id $PACKAGE_ID --sequence 1 \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

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

# Query commited chaincode
# peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA

# Invoke chaincode
# peer chaincode invoke -o localhost:7050 \
# --ordererTLSHostnameOverride orderer.example.com \
# --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
# -C mychannel -n cert \
# --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
# --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
# -c '{"Args":[]}'


# peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
# --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
# -C mychannel -n fabcar \
# --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
# --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
# -c '{"function":"createCar","Args":["CAR11","Honda","Accord","Black","Tom"]}'
