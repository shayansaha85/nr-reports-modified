#!/bin/bash

sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
npm install
sudo apt-get install -y libnss3 libxss1 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxrandr2 libgbm1
sudo apt-get install -y libxkbcommon0
sudo apt-get install -y libxdamage1
sudo apt-get install -y libxfixes3
sudo apt-get install -y libpango1.0-0
sudo apt-get install -y libasound2
npm i axios
