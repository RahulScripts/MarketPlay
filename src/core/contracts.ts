import { AlgorandClient } from '@algorandfoundation/algokit-utils'

export class ContractManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  async deployApp(approvalProgram: string, clearProgram: string, creator: string) {
    return this.client.applications.createApp({
      from: creator,
      approvalProgram,
      clearProgram,
      schema: { localInts: 0, localBytes: 0, globalInts: 4, globalBytes: 4 },
    })
  }

  async callApp(appId: number, caller: string, method: string, args: any[]) {
    return this.client.applications.callApp({
      from: caller,
      appId,
      method,
      methodArgs: args,
    })
  }
}
