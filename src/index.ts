import { Command, Option } from 'commander';
import { handleDecide } from './commands/decide.js';
import { handlePair } from './commands/pair.js';
import { handleStandup } from './commands/standup.js';
import { handleContext } from './commands/context.js';
import { handlePr } from './commands/pr.js';
import { handleWhoami } from './commands/whoami.js';

const program = new Command();

program
  .name('anchor')
  .description('AnchorGit - Zero-Knowledge Decision Ledger for Developers (Open Source)')
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
  .option('-c, --category <type>', 'Category of decision (e.g. architecture, ai-steering, security)', 'architecture')
  .option('-d, --deliberation <seconds>', 'Deliberation focus time in seconds', '0')
  .addOption(
    // Hidden flag consumed by the VS Code extension.
    // Allows the extension to attest that deliberation_seconds was recorded
    // passively by the IDE timer, rather than manually declared by the user.
    // Not shown in --help to keep the user-facing CLI surface clean.
    new Option(
      '--source <source>',
      'Provenance source for deliberation time (set by the VS Code extension)'
    ).hideHelp()
  )
  .addHelpText('after', `
    Examples:
      $ anchor decide "Switched session store to Redis cluster for multi-region scale"
      $ anchor decide "Overrode LLM recommendation to use raw SQL for 10x throughput"

    💡 When to Notarize:
      • DO: Architectural trade-offs, AI course corrections, security shifts, breaking schema changes.
      • SKIP: Typo fixes, CSS tweaks, linting, or routine dependency updates.
    `)
  .action((message, options) => {
    handleDecide(message, options);
  });

program
  .command('context [path]')
  .description('Query historical decision context for a specific file or path')
  .action((message) => {
    handleContext(message);
  });

program
  .command('pr')
  .description('Generate an intent-first Pull Request Decision Brief for code reviewers')
  .action(() => {
    handlePr();
  });

program
  .command('standup')
  .description('Generate a 24-hour engineering impact summary from signed decision logs')
  .action(() => {
    handleStandup();
  });

program
  .command('whoami')
  .description('Display currently paired developer identity and public profile link')
  .action(handleWhoami);

program.parse(process.argv);