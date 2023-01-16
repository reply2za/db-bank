echo "[NOTICE] Ensure localData.txt is up to date"
sleep 3
tsc && pm2 start node dist/index.js --name db-bank
