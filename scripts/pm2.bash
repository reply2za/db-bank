#!/bin/bash

echo "[NOTICE] Ensure localData.txt is up to date"
echo "building js..."
npm install && tsc -p tsconfig.prod.json

echo "running pm2 script..."
NAME=${1:-db-bank}

if pm2 restart $NAME ; then
  pm2 reset $NAME
  echo restarted $NAME
else
  pm2 start ./dist/src/main/index.js --name $NAME
fi

