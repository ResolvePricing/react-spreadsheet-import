import type { DeepPartial } from "@chakra-ui/react";

export const translations = {
	uploadStep: {
		title: "Upload file",
		manifestTitle: (entityTitle?: string) =>
			entityTitle?.length
				? `Expected ${entityTitle.toLowerCase()} data`
				: "Expected data",
		manifestDescription:
			"No worries if column names are different from your data, you can rename or remove columns in the next steps.",
		maxRecordsExceeded: (maxRecords: string) =>
			`Too many records. Up to ${maxRecords} allowed`,
		dropzone: {
			title: "Upload .xlsx, .xls or .csv file",
			errorToastDescription: "upload rejected",
			activeDropzoneTitle: "Drop file here...",
			buttonTitle: "Select file",
			loadingTitle: "Processing...",
		},
		selectSheet: {
			title: "Select the sheet to use",
			nextButtonTitle: "Next",
			backButtonTitle: "Back",
		},
	},
	selectHeaderStep: {
		title: "Select header row",
		nextButtonTitle: "Next",
		backButtonTitle: "Back",
	},
	matchColumnsStep: {
		title: "Match Columns",
		nextButtonTitle: "Next",
		backButtonTitle: "Back",
		userTableTitle: "Your table",
		templateTitle: "Will become",
		selectPlaceholder: "Select...",
		ignoredColumnText: "Column ignored",
		subSelectPlaceholder: "Select...",
		matchDropdownTitle: "Match",
		unmatched: "Unmatched",
		duplicateColumnWarningTitle: "Another column unselected",
		duplicateColumnWarningDescription: "Columns cannot duplicate",
	},
	validationStep: {
		title: "Validate data",
		nextButtonTitle: (rows: string) => `Import ${rows} Rows`,
		backButtonTitle: "Back",
		noRowsMessage: "No data found",
		noRowsMessageWhenFiltered: "No data containing errors",
		discardButtonTitle: "Discard selected rows",
		filterSwitchTitle: "Show only rows with errors",
	},
	alerts: {
		confirmClose: {
			headerTitle: "Exit data import",
			bodyText: "Are you sure? Your current information will not be saved.",
			cancelButtonTitle: "Cancel",
			exitButtonTitle: "Exit",
		},
		submitIncomplete: {
			headerTitle: "Errors detected",
			bodyText: "There are still some rows that contain errors.",
			bodyTextSubmitForbidden: "There are still some rows containing errors.",
			fixErrorsButtonTitle: "Got it!",
			cancelButtonTitle: "Cancel",
			finishButtonTitle: "Submit (rows with errors will be ignored)",
		},
		submitError: {
			title: "Error",
			defaultMessage: "An error occurred while submitting data",
		},
		unmatchedRequiredFields: {
			headerTitle: "Not all columns matched",
			bodyText: "There are required columns that are not matched or ignored.",
			listTitle: "Columns not matched:",
			fixErrorsButtonTitle: "Got it!",
			cancelButtonTitle: "Cancel",
			continueButtonTitle: "Continue anyway",
		},
		toast: {
			error: "Error",
		},
	},
};

export type TranslationsRSIProps = DeepPartial<typeof translations>;
export type Translations = typeof translations;
