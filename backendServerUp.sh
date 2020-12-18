#!/bin/bash
echo "===== Bring up docker containers ====="
docker-compose up -d
sleep 3
echo "===== Bring up the fabric network ====="
./createChannel.sh
sleep 5
# echo "===== Start the server ====="
# cd app
# npm start