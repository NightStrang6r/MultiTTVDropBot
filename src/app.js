import fs from 'fs';
import path from 'path';
import log from './log.js';
import c from 'chalk';
import { spawn } from 'child_process';

class App {
    async run() {
        const accounts = this.loadAccountsJSON('accounts.json');

        if(accounts === 'Created') {
            log(c.green('Accounts.json file created. Write tokens (auth-token) from twitch into it.'));
            return;
        }

        if(!accounts || !accounts.length || accounts.length == 0) {
            log(c.yellow('No accounts provided in accounts.json'));
            return;
        };

        log(c.green(`Loaded ${accounts.length} accounts`));
        process.env['NODE_SKIP_PLATFORM_CHECK'] = 1;

        for(let i = 0; i < accounts.length; i++) {
            const account = accounts[i];

            if(!account.token || account.token.length != 30) {
                log(c.red(`Account ${account.name} has invalid token. Skipping...`));
                continue;
            } 

            this.spawnThread((i+1), account.name, account.token);
        }
    }

    spawnThread(id, name, token) {
        let command = spawn('TTVDropBot.exe', [`--token`, token, '--dl']);
        log(c.magenta(`Thread [${id}] with name [${name}] created`));

        command.stdout.on('data', data => {
            data = data.toString().replace(/\n/g, '');
            log(`${c.green(`[${id}]`)} ${c.magenta(`[${name}]`)}: ${data}`);
        });
        
        command.stderr.on('data', data => {
            log(c.red(`[${id}] [${name}] STDERROR: ${data}`));
        });
        
        command.on('error', (error) => {
            log(c.red(`[${id}] [${name}] ERROR: ${error.message}`));
        });
        
        command.on('close', code => {
            log(c.red(`[${id}] [${name}] THREAD CLOSED: exited with code ${code}`));
            this.spawnThread(id, name, token);
        });
    }

    loadAccountsJSON() {
        try {
            const __dirname = path.resolve(path.dirname(''));
            const accountsPath = path.resolve(__dirname, 'accounts.json');
            const accountsExamplePath = path.resolve(__dirname, 'accounts.example.json');

            if(!fs.existsSync(accountsPath)) {
                if(fs.existsSync(accountsExamplePath)) {
                    const contents = fs.readFileSync(accountsExamplePath);
                    fs.writeFileSync(accountsPath, contents);
                } else {
                    fs.writeFileSync(accountsPath, '[]');
                }
                return 'Created';
            }

            return this.load(accountsPath);
        } catch (e) {
            log(`Error while reading accounts.json file: ${e}`);
            return [];
        }
    }

    load(path) {
        try {
            if(!fs.existsSync(path)) {
                fs.writeFileSync(path, '');
                return null;
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