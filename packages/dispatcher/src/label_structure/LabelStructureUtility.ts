/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {Label} from "./Label";
import {LabelType} from "./LabelType";
import {Result} from "./Result";
import {ScoreEntity} from "./ScoreEntity";
import {ScoreIntent} from "./ScoreIntent";
import {Span} from "./Span";

import { Utility } from "../utility/Utility";

export class LabelStructureUtility {
    // eslint-disable-next-line max-params
    public static getJsonIntentsEntitiesUtterances(
        jsonObjectArray: any,
        hierarchicalLabel: string,
        utteranceLabelsMap: { [id: string]: string[] },
        utteranceLabelDuplicateMap: Map<string, Set<string>>,
        utteranceEntityLabelsMap: { [id: string]: Label[] },
        utteranceEntityLabelDuplicateMap: Map<string, Label[]>): boolean {
        try {
            if (jsonObjectArray.length > 0) {
                jsonObjectArray.forEach((jsonObject: any) => {
                    const utterance: string = jsonObject.text.trim();
                    // eslint-disable-next-line no-prototype-builtins
                    if (jsonObject.hasOwnProperty("intents")) {
                        const labels: string[] = jsonObject.intents;
                        labels.forEach((label: string) => {
                            LabelStructureUtility.addNewLabelUtterance(
                              utterance,
                              label,
                              hierarchicalLabel,
                              utteranceLabelsMap,
                              utteranceLabelDuplicateMap);
                            });
                    }
                    // eslint-disable-next-line no-prototype-builtins
                    if (jsonObject.hasOwnProperty("entities")) {
                        const entities: any[] = jsonObject.entities;
                        entities.forEach((entityEntry: any) => {
                            LabelStructureUtility.addNewEntityLabelUtterance(
                              utterance,
                              entityEntry,
                              utteranceEntityLabelsMap,
                              utteranceEntityLabelDuplicateMap);
                        });
                    }
                });
                return true;
            }
        } catch (error) {
            return false;
        }
        return false;
    }
    public static getJsonScoresUtterances(
        jsonObjectArray: any,
        utteranceLabelScoresMap: { [id: string]: ScoreIntent[] },
        utteranceEntityLabelScoresMap: { [id: string]: ScoreEntity[] }): boolean {
        try {
            if (jsonObjectArray.length > 0) {
                jsonObjectArray.forEach((jsonObject: any) => {
                    const utterance: string = jsonObject.text.trim();
                    // eslint-disable-next-line no-prototype-builtins
                    if (jsonObject.hasOwnProperty("intent_scores")) {
                        const intentScores: any[] = jsonObject.intent_scores;
                        utteranceLabelScoresMap[utterance] = intentScores.map((intentScore: any) => {
                            const intent: string = intentScore.intent;
                            const score: number = intentScore.score;
                            return ScoreIntent.newScoreIntent(intent, score);
                        });
                    }
                    // eslint-disable-next-line no-prototype-builtins
                    if (jsonObject.hasOwnProperty("entity_scores")) {
                        const entityScores: any[] = jsonObject.entity_scores;
                        utteranceEntityLabelScoresMap[utterance] = entityScores.map((entityScore: any) => {
                            const entity: string = entityScore.entity;
                            const startPos: number = entityScore.startPos;
                            const endPos: number = entityScore.endPos;
                            const score: number = entityScore.score;
                            return ScoreEntity.newScoreEntityByPosition(entity, score, startPos, endPos);
                        });
                    }
                });
                return true;
            }
        } catch (error) {
            return false;
        }
        return false;
    }

    public static insertStringPairToStringIdStringSetNativeMap(
        key: string,
        value: string,
        stringKeyStringSetMap: Map<string, Set<string>>): Map<string, Set<string>> {
        if (!stringKeyStringSetMap) {
            stringKeyStringSetMap = new Map<string, Set<string>>();
        }
        if (stringKeyStringSetMap.has(key)) {
            let stringSet: Set<string> | undefined = stringKeyStringSetMap.get(key);
            if (!stringSet) {
                stringSet = new Set<string>();
                stringKeyStringSetMap.set(key, stringSet);
            }
            stringSet.add(value);
        } else {
            const stringSet: Set<string> = new Set<string>();
            stringKeyStringSetMap.set(key, stringSet);
            stringSet.add(value);
        }
        return stringKeyStringSetMap;
    }

    public static insertStringLabelPairToStringIdLabelSetNativeMap(
        key: string,
        value: Label,
        stringKeyLabelSetMap: Map<string, Label[]>): Map<string, Label[]> {
        if (!stringKeyLabelSetMap) {
            stringKeyLabelSetMap = new Map<string, Label[]>();
        }
        if (stringKeyLabelSetMap.has(key)) {
            let labelSet: Label[] | undefined = stringKeyLabelSetMap.get(key);
            if (!labelSet) {
              labelSet = [];
              stringKeyLabelSetMap.set(key, labelSet);
            }
            LabelStructureUtility.addUniqueEntityLabel(value, labelSet);
        } else {
            const labelSet: Label[] = [];
            stringKeyLabelSetMap.set(key, labelSet);
            labelSet.push(value);
        }
        return stringKeyLabelSetMap;
    }

    public static addNewLabelUtterance(
        utterance: string,
        label: string,
        hierarchicalLabel: string,
        utteranceLabelsMap: { [id: string]: string[] },
        utteranceLabelDuplicateMap: Map<string, Set<string>>): void {
        const existingLabels: string[] = utteranceLabelsMap[utterance];
        if (existingLabels) {
            if (hierarchicalLabel && hierarchicalLabel.length > 0) {
                if (!LabelStructureUtility.addUniqueLabel(hierarchicalLabel, existingLabels)) {
                    LabelStructureUtility.insertStringPairToStringIdStringSetNativeMap(
                        utterance,
                        hierarchicalLabel,
                        utteranceLabelDuplicateMap);
                }
            } else if (!LabelStructureUtility.addUniqueLabel(label, existingLabels)) {
                LabelStructureUtility.insertStringPairToStringIdStringSetNativeMap(
                    utterance,
                    label,
                    utteranceLabelDuplicateMap);
            }
        } else if (hierarchicalLabel && hierarchicalLabel.length > 0) {
            utteranceLabelsMap[utterance] = [hierarchicalLabel];
        } else {
            utteranceLabelsMap[utterance] = [label];
        }
    }

    public static addNewEntityLabelUtterance(
        utterance: string,
        entityEntry: any,
        utteranceEntityLabelsMap: { [id: string]: Label[] },
        utteranceEntityLabelDuplicateMap: Map<string, Label[]>): void {
        let existingEntityLabels: Label[] = utteranceEntityLabelsMap[utterance];
        const entity: string = entityEntry.entity;
        const startPos: number = Number(entityEntry.startPos);
        const endPos: number = Number(entityEntry.endPos);
        // const entityMention: string = entityEntry.text;
        const entityLabel: Label = new Label(LabelType.Entity, entity, new Span(startPos, endPos - startPos + 1));
        if (existingEntityLabels) {
            if (!LabelStructureUtility.addUniqueEntityLabel(entityLabel, existingEntityLabels)) {
                LabelStructureUtility.insertStringLabelPairToStringIdLabelSetNativeMap(
                    utterance,
                    entityLabel,
                    utteranceEntityLabelDuplicateMap);
            }
        } else {
            existingEntityLabels = [entityLabel];
            utteranceEntityLabelsMap[utterance] = existingEntityLabels;
        }
    }

    public static addUniqueLabel(newLabel: string, labels: string[]): boolean {
        for (const label of labels) {
            if (label === newLabel) {
                return false;
            }
        }
        labels.push(newLabel);
        return true;
    }

    public static addUniqueEntityLabel(newLabel: Label, labels: Label[]): boolean {
        for (const label of labels) {
            if (label.equals(newLabel)) {
                return false;
            }
        }
        labels.push(newLabel);
        return true;
    }
}
