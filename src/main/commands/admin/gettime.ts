import { MessageEventLocal } from "../../utils/types";
import { exec } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    exec("date", (err, stdout, stderr)=> {
        if (err) console.log(`error: ${stdout}`);
        if (stdout) console.log(`stdout: ${stdout}`);
        if (stderr) console.log(`stderr: ${stderr}`);
    });
}
