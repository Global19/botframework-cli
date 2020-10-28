/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {Command, CLIError, flags} from '@microsoft/bf-cli-command';
import {Orchestrator, OrchestratorHelper, Utility} from '@microsoft/bf-orchestrator';
import {OrchestratorSettings} from '../../../utils/settings';

export default class OrchestratorBaseModelGet extends Command {
  static description: string = 'Gets Orchestrator base model'

  static flags: flags.Input<any> = {
    out: flags.string({char: 'o', description: 'Optional. Path to where Orchestrator base model will be saved to. Default to current working directory.'}),
    versionId: flags.string({description: 'Optional. Base model version to download -- reference basemodel:list output for options.  If not specified, default model will be downloaded.'}),
    debug: flags.boolean({char: 'd'}),
    help: flags.help({char: 'h', description: 'Orchestrator basemodel:get command help'}),
    verbose: flags.boolean({char: 'v', description: 'Enable verbose logging', default: false}),
  }

  async run(): Promise<number> {
    const {flags}: flags.Output = this.parse(OrchestratorBaseModelGet);
    const cwd: string = process.cwd();
    const output: string = flags.out || `${cwd}/model`;
    const nlrId: any = flags.versionId || '';
    Utility.toPrintDebuggingLogToConsole = flags.debug;

    try {
      if (!OrchestratorHelper.exists(output)) {
        OrchestratorHelper.mkDir(output);
      }
      OrchestratorSettings.init(cwd, output, '', cwd);
      await Orchestrator.baseModelGetAsync(
        OrchestratorSettings.ModelPath,
        nlrId,
        (message: any) => {
          if (flags.verbose) {
            this.log(message);
          }
        },
        (message: any) => {
          this.log(`Model ${nlrId} downloaded to ${output}`);
          if (flags.debug) {
            Utility.debuggingLog(`Base model ${nlrId} downloaded to ${output} with message ${message}`);
          }
        });

      OrchestratorSettings.persist();
    } catch (error) {
      throw (new CLIError(error));
    }

    return 0;
  }
}