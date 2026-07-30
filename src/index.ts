import { Command } from 'commander';
import { handleDecide } from './commands/decide.js';
import { handlePair } from './commands/pair.js';
import { handleStandup } from './commands/standup.js';

const program = new Command();

program
  .name('anchor')
  .description('Cryptographic decision logging and human steering for Git workflows.')
  .version('0.1.0')
  .addHelpText('after', `

💡 How & When to Use AnchorGit in your Daily Workflow:

  1. Log a trade-off or decision before committing/pushing:
     $ anchor decide "Switched session storage to Redis for scaling; accepted ~2ms network latency penalty."

  2. Verify zero-knowledge security payload (no source code is sent):
     $ anchor decide "Refactored payment gateway retry logic" --dry-run

  3. Generate your morning standup summary from recent decision logs:
     $ anchor standup

  4. Pair with your team workspace on anchorgit.com:
     $ anchor pair <your-api-key>
`);

program
  .command('pair')
  .description('Link this workstation with your AnchorGit team dashboard using an API key')
  .argument('<token>', 'API key or pairing token from anchorgit.com')
  .action((token) => {
    handlePair(token);
  });

program
  .command('decide')
  .description('Record the WHY (architectural trade-offs, design choices, or AI steering) for your current code changes')
  .argument('<message>', 'Brief summary of why you made this change or what trade-off was accepted')
  .option('--dry-run', 'Print the exact zero-knowledge JSON payload to stdout without sending anywhere')
  .action((message, options) => {
    handleDecide(message, options);
  });

program
  .command('standup')
  .description('Generate a quick standup report of recent decision logs and engineering impact')
  .action(() => {
    handleStandup();
  });

program.parse(process.argv);