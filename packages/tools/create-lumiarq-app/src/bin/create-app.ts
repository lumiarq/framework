#!/usr/bin/env node

import { Command } from 'commander';
import { createLumiarqApp } from '../create-app.js';

const program = new Command();

program
  .name('create-lumiarq-app')
  .description('Create a LumiARQ app scaffold in the target directory')
  .argument('[directory]', 'target directory for scaffold files', '.')
  .action((directory: string) => {
    const result = createLumiarqApp({ projectRoot: directory });
    process.stdout.write(`Scaffolded LumiARQ defaults in ${result.projectRoot}\n`);
  });

program.parse(process.argv);
