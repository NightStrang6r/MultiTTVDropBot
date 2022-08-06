import fs from 'fs';
import log from './log.js';
import c from 'chalk';
import { spawn } from 'child_process';

class App {
    async run() {
        const accounts = this.load('accounts.json');
        if(!accounts || !accounts.length) return;

        log(c.green(`Loaded ${accounts.length} accounts`));

        for(let i = 0; i < accounts.length; i++) {
            const account = accounts[i];

            if(!account.token || account.token.length != 30) continue;

            this.spawnThread(i, account.name, account.token);
        }
    }

    spawnThread(id, name, token) {
        let command = spawn('TTVDropBot.exe', [`--token`, token, '--dl']);
        log(c.magenta(`Thread [${id}] with name [${name}] created`));

        command.stdout.on("data", data => {
            data = data.toString().replace(/\n/g, '');
            log(`${c.green(`[${id}]`)} ${c.magenta(`[${name}]`)}: ${data}`);
        });
        
        command.stderr.on("data", data => {
            log(c.red(`[${id}] [${name}] STDERROR: ${data}`));
        });
        
        command.on('error', (error) => {
            log(c.red(`[${id}] [${name}] ERROR: ${error.message}`));
        });
        
        command.on('close', code => {
            log(c.red(`[${id}] [${name}] THREAD CLOSED: exited with code ${code}`));
        });
    }

    load(path) {
        try {
            if(!fs.existsSync(path)) {
                fs.writeFileSync(path, '');
                return [];
            }
    
            const contents = fs.readFileSync(path);
            const json = JSON.parse(contents);
            return json;
        } catch (e) {
            log(`Error while reading file: ${e}`);
            return [];
        }
    }
}

export default App;