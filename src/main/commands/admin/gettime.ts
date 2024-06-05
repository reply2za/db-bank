import { MessageEventLocal } from "../../utils/types";
import { exec } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    const process = exec("date", async (err, stdout, stderr)=> {
        let resp = "";
        if (err) resp += `error: ${stdout}\n`;
        if (stdout) resp +=`stdout: ${stdout}\n`;
        if (stderr) resp +=`stderr: ${stderr}\n`;
        await event.message.channel.send(resp);
        process.disconnect();
    });

}
