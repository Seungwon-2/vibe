import type { RunnerResult } from '../game/runner/runnerTypes';
import type { RunGateway } from './RunGateway';

/** Keeps a browser copy of every run, then mirrors it to the signed-in API when consent is available. */
export class HybridRunGateway implements RunGateway {
  constructor(private readonly local: RunGateway, private readonly cloud: RunGateway | null) {}

  getBest() { return this.cloud ? this.cloud.getBest() : this.local.getBest(); }
  getRanking() { return this.cloud ? this.cloud.getRanking() : this.local.getRanking(); }
  getPersonalHistory(options?: { limit?: number; cursor?: string | null }) {
    return this.cloud ? this.cloud.getPersonalHistory(options) : this.local.getPersonalHistory(options);
  }

  async submitRun(result: RunnerResult) {
    const localReceipt = await this.local.submitRun(result);
    if (!this.cloud) return localReceipt;
    // Local persistence is authoritative for recovery if API consent or Cosmos is unavailable.
    return this.cloud.submitRun(result);
  }
}
