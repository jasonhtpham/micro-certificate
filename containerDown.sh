#!/bin/bash
echo "===== Stopping containers ====== "
docker stop $(docker ps -a -q)
echo "===== Removing containers ====== "
docker rm $(docker ps -a -q)
echo "===== Cleaning up network and volume memories ====== "
yes | docker volume prune
yes | docker network prune