
echo "[NOTICE] Ensure tsc was built"
echo "[NOTICE] Ensure localData.txt is up to date"
pm2 start node dist/index.js --name db-bank
