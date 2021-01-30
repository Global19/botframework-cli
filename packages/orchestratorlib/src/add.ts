/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {LabelResolver} from './labelresolver';
import {OrchestratorHelper} from './orchestratorhelper';
import {UtilityLabelResolver} from './utilitylabelresolver';
import {Utility} from './utility';

export class OrchestratorAdd {
  // eslint-disable-next-line max-params
  public static async runAsync(
    baseModelPath: string,
    snapshot: Uint8Array,
    luObsjects: any[],
    isDialog: boolean = false,
    entityBaseModelPath: string = '',
    fullEmbeddings: boolean = false) {
    Utility.debuggingLog(`baseModelPath=${baseModelPath}`);
    Utility.debuggingLog(`entityBaseModelPath=${entityBaseModelPath}`);

    if (!baseModelPath || baseModelPath.length === 0) {
      throw new Error('Please provide path to Orchestrator model');
    }

    Utility.debuggingLog('OrchestratorAdd.runAsync(), ready to call LabelResolver.createWithSnapshotAsync()');
    const labelResolver: any = await LabelResolver.createWithSnapshotAsync(baseModelPath, snapshot);
    Utility.debuggingLog('OrchestratorAdd.runAsync(), after calling LabelResolver.createWithSnapshotAsync()');
    UtilityLabelResolver.resetLabelResolverSettingUseCompactEmbeddings(fullEmbeddings);

    const retPayload: any[] = [];
    for (const luObject of (luObsjects || [])) {
      const routingName: string =  Utility.isEmptyString(luObject.routingName) ? '' : luObject.routingName;
      // eslint-disable-next-line no-await-in-loop
      const retVal: any = await OrchestratorHelper.processLuContent(luObject, routingName, isDialog, fullEmbeddings, labelResolver);
      snapshot = retVal.snapshot;
      retPayload.push({id: luObject.id, recognizer: retVal.recognizer});
    }

    return {snapshot: snapshot, outputs: retPayload};
  }
}
