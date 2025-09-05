// @ts-nocheck
import { useCallback, useState, type ReactNode } from "react";
import { Progress, useToast } from "@chakra-ui/react";
import type XLSX from "xlsx-ugnis";
import { UploadStep } from "./UploadStep/UploadStep";
import { SelectHeaderStep } from "./SelectHeaderStep/SelectHeaderStep";
import { SelectSheetStep } from "./SelectSheetStep/SelectSheetStep";
import { mapWorkbook } from "../utils/mapWorkbook";
import { RsiContext } from "../components/Providers";
import { ValidationStep } from "./ValidationStep/ValidationStep";
import { addErrorsAndRunHooks } from "./ValidationStep/utils/dataMutations";
import { MatchColumnsStep } from "./MatchColumnsStep/MatchColumnsStep";
import { exceedsMaxRecords } from "../utils/exceedsMaxRecords";
import { useRsi } from "../hooks/useRsi";
import type { RawData } from "../types";

export enum StepType {
	upload = "upload",
	selectSheet = "selectSheet",
	selectHeader = "selectHeader",
	matchColumns = "matchColumns",
	validateData = "validateData",
}
export type StepState =
	| {
			type: StepType.upload;
	  }
	| {
			type: StepType.selectSheet;
			workbook: XLSX.WorkBook;
	  }
	| {
			type: StepType.selectHeader;
			data: RawData[];
	  }
	| {
			type: StepType.matchColumns;
			data: RawData[];
			headerValues: RawData;
	  }
	| {
			type: StepType.validateData;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			data: any[];
	  };

interface Props {
	state: StepState;
	onNext: (v: StepState) => void;
	onBack?: () => void;
}

export const UploadFlow = ({ state, onNext, onBack }: Props) => {
	const rsiValues = useRsi();
	const {
		maxRecords,
		translations,
		uploadStepHook,
		selectHeaderStepHook,
		matchColumnsStepHook,
		fields,
		rowHook,
		tableHook,
	} = rsiValues;
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const toast = useToast();
	const errorToast = useCallback(
		(description: string) => {
			toast({
				status: "error",
				variant: "left-accent",
				position: "bottom-left",
				title: `${translations.alerts.toast.error}`,
				description,
				isClosable: true,
			});
		},
		[toast, translations],
	);

	const isLargeFile = (uploadedFile?.size ?? 0) > 50 * 1024 * 1024;

	const withPerformanceProvider = (children: ReactNode) => {
		if (!isLargeFile) return children;
		return (
			<RsiContext.Provider
				// Disable expensive features for very large files
				value={{
					...rsiValues,
					autoMapHeaders: false,
					autoMapSelectValues: false,
					autoMapDistance: 0,
				}}
			>
				{children}
			</RsiContext.Provider>
		);
	};

	switch (state.type) {
		case StepType.upload:
			return (
				<UploadStep
					onContinue={async (workbook, file) => {
						setUploadedFile(file);
						const isSingleSheet = workbook.SheetNames.length === 1;
						if (isSingleSheet) {
							if (
								maxRecords &&
								exceedsMaxRecords(
									workbook.Sheets[workbook.SheetNames[0]],
									maxRecords,
								)
							) {
								errorToast(
									translations.uploadStep.maxRecordsExceeded(
										maxRecords.toString(),
									),
								);
								return;
							}
							try {
								const mappedWorkbook = await uploadStepHook(
									mapWorkbook(workbook),
								);
								onNext({
									type: StepType.selectHeader,
									data: mappedWorkbook,
								});
							} catch (e) {
								errorToast((e as Error).message);
							}
						} else {
							onNext({ type: StepType.selectSheet, workbook });
						}
					}}
				/>
			);
		case StepType.selectSheet:
			return withPerformanceProvider(
				<SelectSheetStep
					sheetNames={state.workbook.SheetNames}
					onContinue={async (sheetName) => {
						if (
							maxRecords &&
							exceedsMaxRecords(state.workbook.Sheets[sheetName], maxRecords)
						) {
							errorToast(
								translations.uploadStep.maxRecordsExceeded(
									maxRecords.toString(),
								),
							);
							return;
						}
						try {
							const mappedWorkbook = await uploadStepHook(
								mapWorkbook(state.workbook, sheetName),
							);
							onNext({
								type: StepType.selectHeader,
								data: mappedWorkbook,
							});
						} catch (e) {
							errorToast((e as Error).message);
						}
					}}
					onBack={onBack}
				/>,
			);
		case StepType.selectHeader:
			return withPerformanceProvider(
				<SelectHeaderStep
					data={state.data}
					onContinue={async (...args) => {
						try {
							const { data, headerValues } = await selectHeaderStepHook(
								...args,
							);
							onNext({
								type: StepType.matchColumns,
								data,
								headerValues,
							});
						} catch (e) {
							errorToast((e as Error).message);
						}
					}}
					onBack={onBack}
				/>,
			);
		case StepType.matchColumns:
			return withPerformanceProvider(
				<MatchColumnsStep
					data={state.data}
					headerValues={state.headerValues}
					onContinue={async (values, rawData, columns) => {
						try {
							const data = await matchColumnsStepHook(values, rawData, columns);
							const dataWithMeta = await addErrorsAndRunHooks(
								data,
								fields,
								rowHook,
								tableHook,
							);
							onNext({
								type: StepType.validateData,
								data: dataWithMeta,
							});
						} catch (e) {
							errorToast((e as Error).message);
						}
					}}
					onBack={onBack}
				/>,
			);
		case StepType.validateData:
			return withPerformanceProvider(
				uploadedFile ? (
					<ValidationStep
						initialData={state.data}
						file={uploadedFile}
						onBack={onBack}
					/>
				) : (
					<ValidationStep
						initialData={state.data}
						file={new File([""], "unknown.csv")}
						onBack={onBack}
					/>
				),
			);
		default:
			return <Progress isIndeterminate />;
	}
};
