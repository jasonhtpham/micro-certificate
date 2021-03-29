#!/bin/bash

echo "===== Export binary files ====="
export PATH=${PWD}/bin:$PATH

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

setGlobalsForPeer1Org1(){
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
    
}

setGlobalsForPeer0Org2(){
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051

}

setGlobalsForPeer1Org2(){
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:10051
    
}

CHANNEL_NAME="mychannel"
CC_RUNTIME_LANGUAGE="node"
CC_SRC_PATH="./contract"
CC_NAME="cert"
VERSION="1.1"
SEQUENCE="2"

PackageChaincode() {
    rm -rf ${CC_NAME}.tar.gz
    setGlobalsForPeer0Org1
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${SEQUENCE}
    echo "===================== Chaincode is packaged on peer0.org1 ===================== "
}


InstallChaincode() {
    echo "===== Install CC on peer0.Org1 ====="
    setGlobalsForPeer0Org1
    peer lifecycle chaincode install ${CC_NAME}.tar.gz

    echo "===== Install CC on peer0.Org2 ====="
    setGlobalsForPeer0Org2
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
}


CheckCommitReadiness () {
    peer lifecycle chaincode checkcommitreadiness --channelID mychannel \
    --name cert --version ${VERSION} --sequence ${SEQUENCE} \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA --output json
}

ApproveChaincode () {
    setGlobalsForPeer0Org1

    #Query Installed cc to get PACKAGE_ID
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${SEQUENCE}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)

    # Approve cc on peer0Org1
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
    --package-id $PACKAGE_ID --sequence ${SEQUENCE} \
    --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA

    echo "CC is approved by peer0.Org1.example.com"
    # Check commit readiness on Org1
    echo "===================== checking commit readyness from org 1 ===================== "
    CheckCommitReadiness

    # Approve cc on peer0Org2
    setGlobalsForPeer0Org2

    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL_NAME --name cert --version ${VERSION} \
    --package-id $PACKAGE_ID --sequence ${SEQUENCE} \
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
    --channelID $CHANNEL_NAME --name cert --version ${VERSION} --sequence ${SEQUENCE} \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
    # --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA
    echo "==================== Committing Chaincode ===================="
    peer lifecycle chaincode querycommitted --channelID mychannel --name cert --cafile $ORDERER_CA
}

PackageChaincode
InstallChaincode
ApproveChaincode
CommitChaincode


# Invoke chaincode
peer chaincode invoke -o localhost:7050 \
--ordererTLSHostnameOverride orderer.example.com \
--tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
-C $CHANNEL_NAME -n cert \
--peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
--peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
-c '{"Args":[]}'

# ======================================================================================