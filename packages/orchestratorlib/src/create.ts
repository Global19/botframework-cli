/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from 'path';

// require('fast-text-encoding');

import {Label} from './label';
// import {LabelType} from './labeltype';
import {LabelResolver} from './labelresolver';
// import {Example} from './example';
import {OrchestratorHelper} from './orchestratorhelper';
import {UtilityLabelResolver} from './utilitylabelresolver';
import {Utility} from './utility';

export class OrchestratorCreate {
  // eslint-disable-next-line max-params
  public static async runAsync(baseModelPath: string, inputPathConfiguration: string, outputPath: string,
    hierarchical: boolean = false,
    fullEmbeddings: boolean = false) {
    Utility.debuggingLog(`baseModelPath=${baseModelPath}`);
    Utility.debuggingLog(`inputPathConfiguration=${inputPathConfiguration}`);
    Utility.debuggingLog(`outputPath=${outputPath}`);
    Utility.debuggingLog(`hierarchical=${hierarchical}`);
    Utility.debuggingLog(`fullEmbeddings=${fullEmbeddings}`);
    if (!baseModelPath || baseModelPath.length === 0) {
      throw new Error('Please provide path to Orchestrator model');
    }
    if (!inputPathConfiguration || inputPathConfiguration.length === 0) {
      throw new Error('Please provide path to input file/folder');
    }
    if (!outputPath || outputPath.length === 0) {
      throw new Error('Please provide output path');
    }

    baseModelPath = path.resolve(baseModelPath);
    outputPath = path.resolve(outputPath);

    Utility.debuggingLog('OrchestratorCreate.runAsync(), ready to call LabelResolver.createAsync()');
    await LabelResolver.createAsync(baseModelPath);
    Utility.debuggingLog('OrchestratorCreate.runAsync(), after calling LabelResolver.createAsync()');
    UtilityLabelResolver.resetLabelResolverSettingUseCompactEmbeddings(fullEmbeddings);
    const processedUtteranceLabelsMap: {
      'utteranceLabelsMap': Map<string, Set<string>>;
      'utteranceLabelDuplicateMap': Map<string, Set<string>>;
      'utteranceEntityLabelsMap': Map<string, Label[]>;
      'utteranceEntityLabelDuplicateMap': Map<string, Label[]>; } =
      await OrchestratorHelper.getUtteranceLabelsMap(inputPathConfiguration, hierarchical);
    // Utility.debuggingLog(`OrchestratorCreate.runAsync(), processedUtteranceLabelsMap.utteranceLabelsMap.keys()=${[...processedUtteranceLabelsMap.utteranceLabelsMap.keys()]}`);
    // Utility.debuggingLog(`OrchestratorCreate.runAsync(), processedUtteranceLabelsMap.utteranceEntityLabelsMap.keys()=${[...processedUtteranceLabelsMap.utteranceEntityLabelsMap.keys()]}`);
    LabelResolver.addExamples(processedUtteranceLabelsMap);
    // ---- NOTE-FOR-DEBUGGING ---- const labels: string[] = LabelResolver.getLabels(LabelType.Intent);
    // ---- NOTE-FOR-DEBUGGING ---- Utility.debuggingLog(`OrchestratorCreate.runAsync(), JSON.stringify(labels)=${JSON.stringify(labels)}`);
    // ---- NOTE-FOR-DEBUGGING ---- const examples: any = LabelResolver.getExamples();
    // ---- NOTE-FOR-DEBUGGING ---- const exampleStructureArray: Example[] = Utility.examplesToArray(examples);
    // ---- NOTE-FOR-DEBUGGING ---- for (const example of exampleStructureArray) {
    // ---- NOTE-FOR-DEBUGGING ----   const labels: Label[] = example.labels;
    // ---- NOTE-FOR-DEBUGGING ----   if (labels.length > 1) {
    // ---- NOTE-FOR-DEBUGGING ----     Utility.debuggingLog(`utterance=${example.text}`);
    // ---- NOTE-FOR-DEBUGGING ----   } else {
    // ---- NOTE-FOR-DEBUGGING ----     Utility.debuggingLog('');
    // ---- NOTE-FOR-DEBUGGING ----   }
    // ---- NOTE-FOR-DEBUGGING ----   for (const label of labels) {
    // ---- NOTE-FOR-DEBUGGING ----     Utility.debuggingLog(`label=${label.name}`);
    // ---- NOTE-FOR-DEBUGGING ----   }
    // ---- NOTE-FOR-DEBUGGING ---- }

    const snapshot: any = LabelResolver.createSnapshot();
    // ---- NOTE-FOR-DEBUGGING ---- Utility.debuggingLog(`OrchestratorCreate.runAsync(), snapshot=${snapshot}`);
    // ---- NOTE-FOR-DEBUGGING ---- const snapshotInString: string = (new TextDecoder()).decode(snapshot);
    // ---- NOTE-FOR-DEBUGGING ---- Utility.debuggingLog(`OrchestratorCreate.runAsync(), snapshotInString=${snapshotInString}`);

    const outPath: string = OrchestratorHelper.getOutputPath(outputPath, inputPathConfiguration);
    const resolvedFilePath: string = OrchestratorHelper.writeToFile(outPath, snapshot);
    if (Utility.isEmptyString(resolvedFilePath)) {
      Utility.writeToConsole(`ERROR: failed writing the snapshot to file ${resolvedFilePath}`);
    } else {
      Utility.writeToConsole(`Snapshot written to ${resolvedFilePath}`);
    }
  }
}