// @ts-nocheck
import * as XLSX from "xlsx-ugnis";

export const mapWorkbook = (workbook: XLSX.WorkBook, sheetName?: string) => {
	const worksheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
	const data = XLSX.utils.sheet_to_json(worksheet, {
		header: 1,
		blankrows: false,
		raw: false,
		// Limit rows to avoid exhausting memory on very large files
		sheetRows: 100,
	});
	return data as string[][];
};
