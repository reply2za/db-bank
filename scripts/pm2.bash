
echo "[NOTICE] Ensure tsc was built"
echo "[NOTICE] Ensure localData.txt is up to date"
pm2 start node non/index.js --name db-bank
