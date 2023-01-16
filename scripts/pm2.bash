echo "[NOTICE] Ensure localData.txt is up to date"
sleep 3
echo "building js..."
tsc && pm2 start dist/index.js --name db-bank
