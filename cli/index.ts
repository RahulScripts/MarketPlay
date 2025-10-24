#!/usr/bin/env node
import { Command } from 'commander'
import { ContractManager } from '../src/core/contracts'

import { getAlgorandClient } from '../client'
const program = new Command()

program
  .name('algomarket')
  .description('CLI for Algorand Marketplace SDK')
  .version('0.1.0')

program
  .command('deploy-contract')
  .argument('<approval>', 'Approval TEAL file')
  .argument('<clear>', 'Clear TEAL file')
  .action(async (approval, clear) => {
    const cm = new ContractManager(getAlgorandClient('localnet'))
    const appId = await cm.deployApp(approval, clear, "CREATOR_ADDR")
    console.log(`✅ Contract deployed with App ID: ${appId}`)
  })

program.parse()
