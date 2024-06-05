import { MessageEventLocal } from "../../utils/types";
import { exec } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    exec("sudo date -s \"$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z\"", (err, stdout, stderr)=> {
        if (err) console.log(`error: ${stdout}`);
        if (stdout) console.log(`stdout: ${stdout}`);
        if (stderr) console.log(`stderr: ${stderr}`);
    });
}
