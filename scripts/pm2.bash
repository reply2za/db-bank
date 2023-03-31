echo "[NOTICE] Ensure localData.txt is up to date"
echo "building js..."
npm run prod:build && pm2 start dist/index.js --name db-bank
