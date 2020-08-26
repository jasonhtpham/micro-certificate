export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/crypto-output/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/crypto-output/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/crypto-output/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
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

createChannel(){
    rm -rf ./channel/*
    setGlobalsForPeer0Org1
    
    peer channel create -o localhost:7050 -c $CHANNEL_NAME \
    --ordererTLSHostnameOverride orderer.example.com \
    -f ./channel-artefacts/${CHANNEL_NAME}.tx --outputBlock ./channel/${CHANNEL_NAME}.block \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
}

removeOldCrypto(){
    rm -rf ./api-1.4/crypto/*
    rm -rf ./api-1.4/fabric-client-kv-org1/*
    rm -rf ./api-2.0/org1-wallet/*
    rm -rf ./api-2.0/org2-wallet/*
}


joinChannel(){
    setGlobalsForPeer0Org1
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
    setGlobalsForPeer1Org1
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
    setGlobalsForPeer0Org2
    peer channel join -b ./channel/$CHANNEL_NAME.block
    
#    setGlobalsForPeer1Org2
#    peer channel join -b ./channel/$CHANNEL_NAME.block
    
}

updateAnchorPeers(){
    setGlobalsForPeer0Org1
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artefacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    
    setGlobalsForPeer0Org2
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artefacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA
    
}

# removeOldCrypto

# setGlobalsForPeer1Org1
# createChannel
# joinChannel
# updateAnchorPeers

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