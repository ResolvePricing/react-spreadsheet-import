// @ts-nocheck
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

// Extend column shapes to store selectedColumnType
type EmptyColumn = {
	type: ColumnType.empty;
	index: number;
	header: string;
	selectedColumnType?: string;
};
type IgnoredColumn = {
	type: ColumnType.ignored;
	index: number;
	header: string;
	selectedColumnType?: string;
};
type MatchedColumn<T> = {
	type: ColumnType.matched;
	index: number;
	header: string;
	value: T;
	selectedColumnType?: string;
};
type MatchedSwitchColumn<T> = {
	type: ColumnType.matchedCheckbox;
	index: number;
	header: string;
	value: T;
	selectedColumnType?: string;
};
export type MatchedSelectColumn<T> = {
	type: ColumnType.matchedSelect;
	index: number;
	header: string;
	value: T;
	matchedOptions: Partial<MatchedOptions<T>>[];
	selectedColumnType?: string;
};
export type MatchedSelectOptionsColumn<T> = {
	type: ColumnType.matchedSelectOptions;
	index: number;
	header: string;
	value: T;
	matchedOptions: MatchedOptions<T>[];
	selectedColumnType?: string;
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
		customFieldTemplate,
		onColumnsChange,
	} = rsi as unknown as {
		fields: RsiField<T>[];
		autoMapHeaders: boolean;
		autoMapSelectValues: boolean;
		autoMapDistance: number;
		translations: {
			matchColumnsStep: {
				duplicateColumnWarningTitle: string;
				duplicateColumnWarningDescription: string;
			};
		};
		allowCustomFields: boolean;
		customFieldTemplate?: RsiField<T>;
		onColumnsChange?: (columns: Columns<T>) => void;
	};
	const [isLoading, setIsLoading] = useState(false);
	const safeHeaderValues: string[] = Array.isArray(headerValues)
		? (headerValues as string[])
		: [];
	const [columns, setColumns] = useState<Columns<T>>(
		safeHeaderValues.map((value, index) => ({
			type: ColumnType.empty,
			index,
			header: value ?? "",
			selectedColumnType: undefined,
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
						...(customFieldTemplate as RsiField<T> | undefined),
						label: selectedKey as unknown as string,
						key: selectedKey as T,
						fieldType:
							(customFieldTemplate?.fieldType as RsiField<T>["fieldType"]) ??
							({ type: "input" } as RsiField<T>["fieldType"]),
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
			onColumnsChange?.(
				columns.map<Column<T>>((column, index) => {
					columnIndex === index ? setColumn(column, field, data) : column;
					if (columnIndex === index) {
						return setColumn(column, field, data, autoMapSelectValues);
					}
					if (index === existingFieldIndex) return setColumn(column);
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
			customFieldTemplate,
			onColumnsChange,
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
			onColumnsChange?.(
				columns.map((column, index) =>
					columnIndex === index && "matchedOptions" in column
						? setSubColumn(column, entry, value)
						: column,
				),
			);
		},
		[columns, setColumns, onColumnsChange],
	);

	// New handler: per-column type selection
	const onColumnTypeChange = useCallback(
		(value: string, columnIndex: number) => {
			setColumns((prev) =>
				prev.map((column, index) =>
					columnIndex === index
						? ({
								...(column as { [k: string]: unknown }),
								selectedColumnType: value,
							} as Column<T>)
						: column,
				),
			);
			onColumnsChange?.(
				columns.map((column, index) =>
					columnIndex === index
						? ({
								...(column as { [k: string]: unknown }),
								selectedColumnType: value,
							} as Column<T>)
						: column,
				),
			);
		},
		[columns, onColumnsChange],
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

	// Initialize columns (auto-map + custom fields) only once to avoid update loops
	const initializedRef = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: initialize once to prevent setState loops
	useEffect(() => {
		if (initializedRef.current) return;
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
						...(customFieldTemplate as RsiField<T>),
						label: col.header as unknown as string,
						key: col.header as unknown as T,
						fieldType:
							(customFieldTemplate?.fieldType as RsiField<T>["fieldType"]) ?? {
								type: "input",
							},
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
		if (next !== columns) setColumns(next);
		onColumnsChange?.(next);
		initializedRef.current = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
						onColumnTypeChange={onColumnTypeChange}
						columnTypes={(() => {
							const CUSTOM_PREFIX = "__custom__:";
							// @ts-ignore - narrow at runtime
							let valueKey: string | undefined =
								"value" in column
									? (column as { value: string }).value
									: undefined;
							if (valueKey?.startsWith(CUSTOM_PREFIX)) {
								valueKey = valueKey.slice(CUSTOM_PREFIX.length);
							}
							const field = effectiveFields.find(
								(f) => (f.key as unknown as string) === (valueKey ?? ""),
							);
							const fromField =
								(field as unknown as { columnTypes?: string[] } | undefined)
									?.columnTypes ?? [];
							if (fromField.length > 1) return fromField;
							const fromTemplate =
								(
									customFieldTemplate as unknown as
										| { columnTypes?: string[] }
										| undefined
								)?.columnTypes ?? [];
							return fromTemplate;
						})()}
					/>
				)}
			/>
		</>
	);
};
