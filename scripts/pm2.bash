#!/bin/bash

echo "[NOTICE] Ensure localData.txt is up to date"
echo "building js..."
npm install;
npm run build:prod;

echo "running pm2 script..."
NAME=${1:-db-bank}

if pm2 restart $NAME ; then
  pm2 reset $NAME
  echo restarted $NAME
else
  pm2 start npm --name $NAME -- run start:prod
fi

