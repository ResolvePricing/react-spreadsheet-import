// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@chakra-ui/react";
import { UserTableColumn } from "./components/UserTableColumn";
import { useRsi } from "../../hooks/useRsi";
import { TemplateColumn } from "./components/TemplateColumn";
import { ColumnGrid } from "./components/ColumnGrid";
import { setColumn } from "./utils/setColumn";
import { setIgnoreColumn } from "./utils/setIgnoreColumn";
import { setSubColumn } from "./utils/setSubColumn";
import { normalizeTableData } from "./utils/normalizeTableData";
import type { RawData } from "../../types";
import { getMatchedColumns } from "./utils/getMatchedColumns";
import { UnmatchedFieldsAlert } from "../../components/Alerts/UnmatchedFieldsAlert";
import { findUnmatchedRequiredFields } from "./utils/findUnmatchedRequiredFields";
import type { Field as RsiField } from "../../types";

export type MatchColumnsProps<T extends string> = {
	data: RawData[];
	headerValues: RawData;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onContinue: (data: any[], rawData: RawData[], columns: Columns<T>) => void;
	onBack?: () => void;
};

// biome-ignore lint/style/useEnumInitializers: <explanation>
export enum ColumnType {
	empty,
	ignored,
	matched,
	matchedCheckbox,
	matchedSelect,
	matchedSelectOptions,
}

export type MatchedOptions<T> = {
	entry: string;
	value: T;
};

type EmptyColumn = { type: ColumnType.empty; index: number; header: string };
type IgnoredColumn = {
	type: ColumnType.ignored;
	index: number;
	header: string;
};
type MatchedColumn<T> = {
	type: ColumnType.matched;
	index: number;
	header: string;
	value: T;
};
type MatchedSwitchColumn<T> = {
	type: ColumnType.matchedCheckbox;
	index: number;
	header: string;
	value: T;
};
export type MatchedSelectColumn<T> = {
	type: ColumnType.matchedSelect;
	index: number;
	header: string;
	value: T;
	matchedOptions: Partial<MatchedOptions<T>>[];
};
export type MatchedSelectOptionsColumn<T> = {
	type: ColumnType.matchedSelectOptions;
	index: number;
	header: string;
	value: T;
	matchedOptions: MatchedOptions<T>[];
};

export type Column<T extends string> =
	| EmptyColumn
	| IgnoredColumn
	| MatchedColumn<T>
	| MatchedSwitchColumn<T>
	| MatchedSelectColumn<T>
	| MatchedSelectOptionsColumn<T>;

export type Columns<T extends string> = Column<T>[];

export const MatchColumnsStep = <T extends string>({
	data,
	headerValues,
	onContinue,
	onBack,
}: MatchColumnsProps<T>) => {
	const toast = useToast();
	const dataExample = data.slice(0, 3);
	const rsi = useRsi<T>();
	const {
		fields,
		autoMapHeaders,
		autoMapSelectValues,
		autoMapDistance,
		translations,
		allowCustomFields,
	} = rsi;
	const [isLoading, setIsLoading] = useState(false);
	const safeHeaderValues: string[] = Array.isArray(headerValues)
		? (headerValues as string[])
		: [];
	const [columns, setColumns] = useState<Columns<T>>(
		safeHeaderValues.map((value, index) => ({
			type: ColumnType.empty,
			index,
			header: value ?? "",
		})),
	);
	const [showUnmatchedFieldsAlert, setShowUnmatchedFieldsAlert] =
		useState(false);
	const [customFields, setCustomFields] = useState<RsiField<T>[]>([]);

	const effectiveFields: RsiField<T>[] = useMemo(() => {
		const map = new Map<string, RsiField<T>>();
		for (const f of fields as unknown as RsiField<T>[]) {
			map.set(f.key as unknown as string, f as RsiField<T>);
		}
		for (const f of customFields) {
			const k = f.key as unknown as string;
			if (!map.has(k)) map.set(k, f);
		}
		return Array.from(map.values());
	}, [fields, customFields]);

	const onChange = useCallback(
		(value: T, columnIndex: number) => {
			// Support dynamic custom field selection when value uses the custom prefix
			const CUSTOM_PREFIX = "__custom__:";
			const isCustom =
				typeof value === "string" && value.startsWith(CUSTOM_PREFIX);
			const selectedKey = isCustom
				? (value as string).slice(CUSTOM_PREFIX.length)
				: value;
			const dynamicField: RsiField<T> | undefined = isCustom
				? ({
						label: selectedKey as unknown as string,
						key: selectedKey as T,
						fieldType: { type: "input" },
					} as RsiField<T>)
				: undefined;
			const field =
				((fields as unknown as RsiField<T>[]).find(
					(field: RsiField<T>) => field.key === value,
				) as unknown as RsiField<T> | undefined) || dynamicField;

			// If user picked a custom field, merge it for downstream components (TemplateColumn etc.)
			if (dynamicField) {
				setCustomFields((prev) =>
					prev.find((f) => f.key === dynamicField.key)
						? prev
						: [...prev, dynamicField],
				);
			}

			const existingFieldIndex = columns.findIndex(
				(column) => "value" in column && column.value === field?.key,
			);
			setColumns(
				columns.map<Column<T>>((column, index) => {
					columnIndex === index ? setColumn(column, field, data) : column;
					if (columnIndex === index) {
						return setColumn(column, field, data, autoMapSelectValues);
					}
					if (index === existingFieldIndex) {
						toast({
							status: "warning",
							variant: "left-accent",
							position: "bottom-left",
							title: translations.matchColumnsStep.duplicateColumnWarningTitle,
							description:
								translations.matchColumnsStep.duplicateColumnWarningDescription,
							isClosable: true,
						});
						return setColumn(column);
					}
					return column;
				}),
			);
		},
		[
			autoMapSelectValues,
			columns,
			data,
			fields,
			toast,
			translations.matchColumnsStep.duplicateColumnWarningDescription,
			translations.matchColumnsStep.duplicateColumnWarningTitle,
		],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const onIgnore = useCallback(
		(columnIndex: number) => {
			setColumns(
				columns.map((column, index) =>
					columnIndex === index ? setIgnoreColumn<T>(column) : column,
				),
			);
		},
		[columns, setColumns],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const onRevertIgnore = useCallback(
		(columnIndex: number) => {
			setColumns(
				columns.map((column, index) =>
					columnIndex === index ? setColumn(column) : column,
				),
			);
		},
		[columns, setColumns],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const onSubChange = useCallback(
		(value: string, columnIndex: number, entry: string) => {
			setColumns(
				columns.map((column, index) =>
					columnIndex === index && "matchedOptions" in column
						? setSubColumn(column, entry, value)
						: column,
				),
			);
		},
		[columns, setColumns],
	);

	const unmatchedRequiredFields = useMemo(
		() => findUnmatchedRequiredFields(effectiveFields, columns),
		[effectiveFields, columns],
	);

	const handleOnContinue = useCallback(async () => {
		if (unmatchedRequiredFields.length > 0) {
			setShowUnmatchedFieldsAlert(true);
		} else {
			setIsLoading(true);
			await onContinue(
				normalizeTableData(columns, data, effectiveFields),
				data,
				columns,
			);
			setIsLoading(false);
		}
	}, [
		unmatchedRequiredFields.length,
		onContinue,
		columns,
		data,
		effectiveFields,
	]);

	const handleAlertOnContinue = useCallback(async () => {
		setShowUnmatchedFieldsAlert(false);
		setIsLoading(true);
		await onContinue(
			normalizeTableData(columns, data, effectiveFields),
			data,
			columns,
		);
		setIsLoading(false);
	}, [onContinue, columns, data, effectiveFields]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(
		() => {
			let next = columns;
			if (autoMapHeaders) {
				next = getMatchedColumns(
					columns,
					fields,
					data,
					autoMapDistance,
					autoMapSelectValues,
				);
			}
			if (allowCustomFields) {
				const added: RsiField<T>[] = [];
				next = next.map((col) => {
					if (col.type === ColumnType.empty) {
						const dynamicField: RsiField<T> = {
							label: col.header as unknown as string,
							key: col.header as unknown as T,
							fieldType: { type: "input" },
						};
						added.push(dynamicField);
						return setColumn(col, dynamicField, data, autoMapSelectValues);
					}
					return col;
				});
				if (added.length) {
					setCustomFields((prev) => {
						const map = new Map<string, RsiField<T>>();
						for (const f of prev) map.set(f.key as unknown as string, f);
						for (const f of added) {
							const k = f.key as unknown as string;
							if (!map.has(k)) map.set(k, f);
						}
						return Array.from(map.values());
					});
				}
			}
			setColumns(next);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	return (
		<>
			<UnmatchedFieldsAlert
				isOpen={showUnmatchedFieldsAlert}
				onClose={() => setShowUnmatchedFieldsAlert(false)}
				fields={unmatchedRequiredFields}
				onConfirm={handleAlertOnContinue}
			/>
			<ColumnGrid
				columns={columns}
				onContinue={handleOnContinue}
				onBack={onBack}
				isLoading={isLoading}
				userColumn={(column) => (
					<UserTableColumn
						column={column}
						onIgnore={onIgnore}
						onRevertIgnore={onRevertIgnore}
						entries={dataExample.map((row) => row[column.index])}
					/>
				)}
				templateColumn={(column) => (
					<TemplateColumn
						column={column}
						onChange={onChange}
						onSubChange={onSubChange}
					/>
				)}
			/>
		</>
	);
};
