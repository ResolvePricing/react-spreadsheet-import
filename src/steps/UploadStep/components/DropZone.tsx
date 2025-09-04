// @ts-nocheck
import { Box, Button, Text, useStyleConfig, useToast } from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx-ugnis";
import { useState } from "react";
import { getDropZoneBorder } from "../utils/getDropZoneBorder";
import { useRsi } from "../../../hooks/useRsi";
import { readFileAsync } from "../utils/readFilesAsync";
import type { themeOverrides } from "../../../theme";
import * as cptable from "xlsx-ugnis/dist/cpexcel";

XLSX.set_cptable(cptable);

type DropZoneProps = {
	onContinue: (data: XLSX.WorkBook, file: File) => void;
	isLoading: boolean;
};

export const DropZone = ({ onContinue, isLoading }: DropZoneProps) => {
	const { translations, maxFileSize, dateFormat, parseRaw } = useRsi();
	const styles = useStyleConfig(
		"UploadStep",
	) as (typeof themeOverrides)["components"]["UploadStep"]["baseStyle"];
	const toast = useToast();
	const [loading, setLoading] = useState(false);
	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		noClick: true,
		noKeyboard: true,
		maxFiles: 1,
		maxSize: maxFileSize,
		accept: {
			"application/vnd.ms-excel": [".xls"],
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
				".xlsx",
			],
			"text/csv": [".csv"],
		},
		onDropRejected: (fileRejections) => {
			setLoading(false);
			// biome-ignore lint/complexity/noForEach: <explanation>
			fileRejections.forEach((fileRejection) => {
				toast({
					status: "error",
					variant: "left-accent",
					position: "bottom-left",
					title: `${fileRejection.file.name} ${translations.uploadStep.dropzone.errorToastDescription}`,
					description: fileRejection.errors[0].message,
					isClosable: true,
				});
			});
		},
		onDropAccepted: async ([file]) => {
			setLoading(true);
			try {
				const LARGE = 50 * 1024 * 1024;
				const isCsv =
					file.type === "text/csv" || /\.csv$/i.test(file.name || "");
				let workbook: XLSX.WorkBook;

				if (isCsv && file.size > LARGE) {
					const HEAD_BYTES = 2 * 1024 * 1024; // 2MB
					const headText = await file.slice(0, HEAD_BYTES).text();
					workbook = XLSX.read(headText, {
						type: "string",
						raw: true,
						dense: true,
						sheetRows: 100,
					});
				} else {
					const arrayBuffer = await readFileAsync(file);
					const isLarge = file.size > LARGE;
					workbook = XLSX.read(arrayBuffer, {
						dense: true,
						raw: isLarge || parseRaw,
						cellDates: !isLarge,
						dateNF: isLarge ? undefined : dateFormat,
						cellFormula: false,
						cellHTML: false,
						cellNF: false,
						cellStyles: false,
						cellText: !isLarge,
						codepage: 65001,
						...(isLarge ? { sheets: [0], sheetRows: 100 } : {}),
					});
				}

				onContinue(workbook, file);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				toast({
					status: "error",
					variant: "left-accent",
					position: "bottom-left",
					title: `${file?.name ?? "File"} ${translations.uploadStep.dropzone.errorToastDescription}`,
					description: message,
					isClosable: true,
				});
			} finally {
				setLoading(false);
			}
		},
	});

	return (
		<Box
			{...getRootProps()}
			{...getDropZoneBorder(styles.dropZoneBorder)}
			width="100%"
			display="flex"
			justifyContent="center"
			alignItems="center"
			flexDirection="column"
			flex={1}
		>
			<input {...getInputProps()} data-testid="rsi-dropzone" />
			{isDragActive ? (
				<Text sx={styles.dropzoneText}>
					{translations.uploadStep.dropzone.activeDropzoneTitle}
				</Text>
			) : loading || isLoading ? (
				<Text sx={styles.dropzoneText}>
					{translations.uploadStep.dropzone.loadingTitle}
				</Text>
			) : (
				<>
					<Text sx={styles.dropzoneText}>
						{translations.uploadStep.dropzone.title}
					</Text>
					<Button sx={styles.dropzoneButton} onClick={open}>
						{translations.uploadStep.dropzone.buttonTitle}
					</Button>
				</>
			)}
		</Box>
	);
};
