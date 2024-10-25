import { canvas, sound, storage } from "."
import { Label } from "../classes"
import { getLabelById } from "../decorators/label-decorator"
import { restoreDeepDiffChanges } from "../functions/diff-utility"
import { createExportableElement } from "../functions/export-utility"
import { getGamePath } from "../functions/path-utility"
import IHistoryStep, { IHistoryStepData } from "../interface/IHistoryStep"
import IOpenedLabel from "../interface/IOpenedLabel"
import ChoicesMadeType from "../types/ChoicesMadeType"
import { LabelIdType } from "../types/LabelIdType"

type AllOpenedLabelsType = { [key: LabelIdType]: { biggestStep: number, openCount: number } }

type CurrentStepTimesCounterMemotyData = {
    lastStepIndexs?: number[],
    usedRandomNumbers?: { [minmaxkey: string]: number[] },
    stepSha1: string,
}
type CurrentStepTimesCounterMemoty = {
    [key: LabelIdType]: {
        [key: string]: CurrentStepTimesCounterMemotyData
    }
}

export default class NarrationManagerStatic {
    private constructor() { }
    static _stepsHistory: IHistoryStep[] = []
    /**
     * Number of steps function that are running.
     * If you run a step that have a goNext, this number is > 1.
     */
    static stepsRunning: number = 0
    static choiseMadeTemp: undefined | number = undefined
    /**
     * is a list of all labels that have been opened during the progression of the steps.
     * the key is the label id and the biggest step opened.
     */
    static get allOpenedLabels() {
        return storage.getVariable<AllOpenedLabelsType>(storage.keysSystem.OPENED_LABELS_COUNTER_KEY) || {}
    }
    static set allOpenedLabels(value: AllOpenedLabelsType) {
        storage.setVariable(storage.keysSystem.OPENED_LABELS_COUNTER_KEY, value)
    }
    static getCurrentStepTimesCounterData(nestedId: string = ""): CurrentStepTimesCounterMemotyData | null {
        let currentLabelStepIndex = NarrationManagerStatic.currentLabelStepIndex
        if (currentLabelStepIndex === null) {
            console.error("[Pixi’VN] currentLabelStepIndex is null")
            return null
        }
        let currentLabelStepIndexId = `${currentLabelStepIndex}${nestedId}`
        let labelId = NarrationManagerStatic.currentLabelId
        let currentLabel = NarrationManagerStatic._currentLabel
        if (!labelId || currentLabelStepIndex === null || !currentLabel) {
            console.error("[Pixi’VN] currentLabelId or currentLabelStepIndex is null or currentLabel not found")
            return null
        }
        let stepSha1 = currentLabel.getStepSha1(currentLabelStepIndex) || "error"
        let obj = storage.getVariable<CurrentStepTimesCounterMemoty>(storage.keysSystem.CURRENT_STEP_TIMES_COUNTER_KEY) || {}
        if (!obj[labelId]) {
            obj[labelId] = {}
        }
        if (!obj[labelId][currentLabelStepIndexId] || obj[labelId][currentLabelStepIndexId].stepSha1 != stepSha1) {
            obj[labelId][currentLabelStepIndexId] = { stepSha1: stepSha1 }
        }
        return obj[labelId][currentLabelStepIndexId]
    }
    private static setCurrentStepTimesCounterData(nestedId: string = "", data: CurrentStepTimesCounterMemotyData) {
        let currentLabelStepIndex = NarrationManagerStatic.currentLabelStepIndex
        let currentLabelStepIndexId = currentLabelStepIndex + nestedId
        let labelId = NarrationManagerStatic.currentLabelId
        if (!labelId || currentLabelStepIndex === null) {
            console.error("[Pixi’VN] currentLabelId or currentLabelStepIndex is null")
            return
        }
        let obj = storage.getVariable<CurrentStepTimesCounterMemoty>(storage.keysSystem.CURRENT_STEP_TIMES_COUNTER_KEY) || {}
        if (!obj[labelId]) {
            obj[labelId] = {}
        }
        obj[labelId][currentLabelStepIndexId] = data
        storage.setVariable(storage.keysSystem.CURRENT_STEP_TIMES_COUNTER_KEY, obj)
    }
    static getCurrentStepTimesCounter(nestedId: string = ""): number {
        let lastStep = NarrationManagerStatic._lastStepIndex
        let obj = NarrationManagerStatic.getCurrentStepTimesCounterData(nestedId)
        if (!obj) {
            console.error("[Pixi’VN] getCurrentStepTimesCounter obj is null")
            return 0
        }
        let list = obj.lastStepIndexs || []
        let listContainLastStep = list.find((item) => item === lastStep)
        if (!listContainLastStep) {
            list.push(lastStep)
            obj.lastStepIndexs = list
            NarrationManagerStatic.setCurrentStepTimesCounterData(nestedId, obj)
        }
        return list.length
    }
    static getRandomNumber(min: number, max: number, options: {
        onceOnly?: boolean
        nestedId?: string
    } = {}): number | undefined {
        let nestedId = options.nestedId || ""
        let onceonly = options.onceOnly || false
        if (onceonly) {
            let obj = NarrationManagerStatic.getCurrentStepTimesCounterData(nestedId)
            if (!obj) {
                return undefined
            }
            let usedRandomNumbers = obj.usedRandomNumbers || {}
            // get a random number between min and max and not in the usedRandomNumbers, if all numbers are in the usedRandomNumbers, return null
            let allNumbers = Array.from({ length: max - min + 1 }, (_, i) => i + min).filter((item) => !usedRandomNumbers[`${min}-${max}`]?.includes(item))
            if (allNumbers.length === 0) {
                return undefined
            }
            let randomIndex = Math.floor(Math.random() * allNumbers.length)
            let randomNumber = allNumbers[randomIndex]
            if (!usedRandomNumbers[`${min}-${max}`]) {
                usedRandomNumbers[`${min}-${max}`] = []
            }
            usedRandomNumbers[`${min}-${max}`].push(randomNumber)
            obj.usedRandomNumbers = usedRandomNumbers
            NarrationManagerStatic.setCurrentStepTimesCounterData(nestedId, obj)
            return randomNumber
        }
        return Math.floor(Math.random() * (max - min + 1)) + min
    }
    static resetCurrentStepTimesCounter(nestedId: string = "") {
        let currentLabelStepIndex = NarrationManagerStatic.currentLabelStepIndex
        let currentLabelStepIndexId = currentLabelStepIndex + nestedId
        let labelId = NarrationManagerStatic.currentLabelId
        if (!labelId || currentLabelStepIndex === null) {
            console.error("[Pixi’VN] currentLabelId or currentLabelStepIndex is null")
            return
        }
        let obj = storage.getVariable<CurrentStepTimesCounterMemoty>(storage.keysSystem.CURRENT_STEP_TIMES_COUNTER_KEY) || {}
        if (!obj[labelId]) {
            obj[labelId] = {}
        }
        obj[labelId][currentLabelStepIndexId] = { lastStepIndexs: [], stepSha1: "" }
        storage.setVariable(storage.keysSystem.CURRENT_STEP_TIMES_COUNTER_KEY, obj)
    }
    /**
     * is a list of all choices made by the player during the progression of the steps.
     */
    static get allChoicesMade() {
        return storage.getVariable<ChoicesMadeType[]>(storage.keysSystem.ALL_CHOICES_MADE_KEY) || []
    }
    static set allChoicesMade(value: ChoicesMadeType[]) {
        storage.setVariable(storage.keysSystem.ALL_CHOICES_MADE_KEY, value)
    }
    static _lastStepIndex: number = 0
    /**
     * Increase the last step index that occurred during the progression of the steps.
     */
    static increaseLastStepIndex() {
        NarrationManagerStatic._lastStepIndex++
    }
    static _openedLabels: IOpenedLabel[] = []
    static get _currentLabel(): Label | undefined {
        if (NarrationManagerStatic.currentLabelId) {
            return getLabelById(NarrationManagerStatic.currentLabelId)
        }
    }
    /**
     * currentLabelId is the current label id that occurred during the progression of the steps.
     */
    static get currentLabelId(): LabelIdType | undefined {
        if (NarrationManagerStatic._openedLabels.length > 0) {
            let item = NarrationManagerStatic._openedLabels[NarrationManagerStatic._openedLabels.length - 1]
            return item.label
        }
        return undefined
    }
    static get currentLabelStepIndex(): number | null {
        if (NarrationManagerStatic._openedLabels.length > 0) {
            let item = NarrationManagerStatic._openedLabels[NarrationManagerStatic._openedLabels.length - 1]
            return item.currentStepIndex
        }
        return null
    }
    /**
     * lastHistoryStep is the last history step that occurred during the progression of the steps.
     */
    private static get lastHistoryStep(): IHistoryStep | null {
        if (NarrationManagerStatic._stepsHistory.length > 0) {
            return NarrationManagerStatic._stepsHistory[NarrationManagerStatic._stepsHistory.length - 1]
        }
        return null
    }
    static _originalStepData: IHistoryStepData | undefined = undefined
    static get originalStepData(): IHistoryStepData {
        if (!NarrationManagerStatic._originalStepData) {
            return {
                path: "",
                storage: {},
                canvas: {
                    elementAliasesOrder: [],
                    elements: {},
                    tickers: {},
                    tickersSteps: {},
                    tickersOnPause: {},
                },
                sound: {
                    soundAliasesOrder: [],
                    sounds: {},
                    playInStepIndex: {},
                },
                labelIndex: -1,
                openedLabels: [],
            }
        }
        return createExportableElement(NarrationManagerStatic._originalStepData)
    }
    static set originalStepData(value: IHistoryStepData) {
        NarrationManagerStatic._originalStepData = createExportableElement(value)
    }

    static get currentStepData(): IHistoryStepData {
        let currentStepData: IHistoryStepData = {
            path: getGamePath(),
            storage: storage.export(),
            canvas: canvas.export(),
            sound: sound.removeOldSoundAndExport(),
            labelIndex: NarrationManagerStatic.currentLabelStepIndex || 0,
            openedLabels: createExportableElement(NarrationManagerStatic._openedLabels),
        }
        return currentStepData
    }

    /* Edit History Methods */

    /**
     * Add a label to the history.
     * @param label The label to add to the history.
     * @param stepIndex The step index of the label.
     * @param choiseMade The index of the choise made by the player. (This params is used in the choice menu)
     */
    static addLabelHistory(label: LabelIdType, stepIndex: number) {
        let allOpenedLabels = NarrationManagerStatic.allOpenedLabels
        let oldStepIndex = NarrationManagerStatic.allOpenedLabels[label]?.biggestStep || 0
        let openCount = NarrationManagerStatic.allOpenedLabels[label]?.openCount || 0
        if (!oldStepIndex || oldStepIndex < stepIndex) {
            allOpenedLabels[label] = { biggestStep: stepIndex, openCount: openCount }
            NarrationManagerStatic.allOpenedLabels = allOpenedLabels
        }
    }
    static addChoicesMade(label: LabelIdType, stepIndex: number, stepSha: string, choiseMade: number) {
        let allChoicesMade = NarrationManagerStatic.allChoicesMade
        let alredyMade = allChoicesMade.findIndex((item) =>
            item.labelId === label &&
            item.stepIndex === stepIndex &&
            item.choiceIndex === choiseMade &&
            item.stepSha1 === stepSha
        )
        if (alredyMade < 0) {
            allChoicesMade.push({ labelId: label, stepIndex: stepIndex, choiceIndex: choiseMade, stepSha1: stepSha, madeTimes: 1 })
        }
        else {
            allChoicesMade[alredyMade].madeTimes++
        }
        NarrationManagerStatic.allChoicesMade = allChoicesMade
    }
    /**
     * Add a label to the history.
     * @param label The label to add to the history.
     */
    static pushNewLabel(label: LabelIdType) {
        let currentLabel = getLabelById(label)
        if (!currentLabel) {
            throw new Error(`[Pixi’VN] Label ${label} not found`)
        }
        NarrationManagerStatic._openedLabels.push({
            label: label,
            currentStepIndex: 0,
        })
        let allOpenedLabels = NarrationManagerStatic.allOpenedLabels
        let biggestStep = NarrationManagerStatic.allOpenedLabels[label]?.biggestStep || 0
        let openCount = NarrationManagerStatic.allOpenedLabels[label]?.openCount || 0
        allOpenedLabels[label] = { biggestStep: biggestStep, openCount: openCount + 1 }
        NarrationManagerStatic.allOpenedLabels = allOpenedLabels
    }
    /**
     * Increase the current step index of the current label.
     */
    static increaseCurrentStepIndex() {
        if (NarrationManagerStatic._openedLabels.length > 0) {
            let item = NarrationManagerStatic._openedLabels[NarrationManagerStatic._openedLabels.length - 1]
            NarrationManagerStatic._openedLabels[NarrationManagerStatic._openedLabels.length - 1] = {
                ...item,
                currentStepIndex: item.currentStepIndex + 1,
            }
        }
    }
    static restoreLastLabelList() {
        NarrationManagerStatic._openedLabels = NarrationManagerStatic.originalStepData.openedLabels
    }

    /* Run Methods */


    /* Go Back & Refresh Methods */

    static goBackInternal(steps: number, restoredStep: IHistoryStepData): IHistoryStepData {
        if (steps <= 0) {
            return restoredStep
        }
        if (NarrationManagerStatic._stepsHistory.length == 0) {
            return restoredStep
        }
        let lastHistoryStep = NarrationManagerStatic.lastHistoryStep
        if (lastHistoryStep) {
            try {
                let result = restoreDeepDiffChanges(restoredStep, lastHistoryStep.diff)
                NarrationManagerStatic._lastStepIndex = lastHistoryStep.index
                NarrationManagerStatic._stepsHistory.pop()
                return NarrationManagerStatic.goBackInternal(steps - 1, result)
            }
            catch (e) {
                console.error("[Pixi’VN] Error applying diff", e)
                return restoredStep
            }
        }
        else {
            return restoredStep
        }
    }
    static async restoreFromHistoryStep(restoredStep: IHistoryStepData, navigate: (path: string) => void) {
        NarrationManagerStatic._originalStepData = restoredStep
        NarrationManagerStatic._openedLabels = createExportableElement(restoredStep.openedLabels)
        if (NarrationManagerStatic._currentLabel && NarrationManagerStatic._currentLabel.onLoadStep) {
            await NarrationManagerStatic._currentLabel.onLoadStep(NarrationManagerStatic.currentLabelStepIndex || 0, NarrationManagerStatic._currentLabel)
        }
        storage.import(createExportableElement(restoredStep.storage))
        canvas.import(createExportableElement(restoredStep.canvas))
        sound.import(createExportableElement(restoredStep.sound), NarrationManagerStatic._lastStepIndex - 1)
        navigate(restoredStep.path)
    }
}
