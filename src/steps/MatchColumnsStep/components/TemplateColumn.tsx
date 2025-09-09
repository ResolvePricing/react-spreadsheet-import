import {
	Flex,
	Text,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionIcon,
	Box,
	AccordionPanel,
	useStyleConfig,
	Select as ChakraSelect,
} from "@chakra-ui/react";
import { useRsi } from "../../../hooks/useRsi";
import type { Column } from "../MatchColumnsStep";
import { ColumnType } from "../MatchColumnsStep";
import { MatchIcon } from "./MatchIcon";
import type { Fields } from "../../../types";
import type { Translations } from "../../../translationsRSIProps";
import { MatchColumnSelect } from "../../../components/Selects/MatchColumnSelect";
import { SubMatchingSelect } from "./SubMatchingSelect";
import type { Styles } from "./ColumnGrid";
import type { SelectOption } from "../../../types";

const getAccordionTitle = <T extends string>(
	fields: Fields<T>,
	column: Column<T>,
	translations: Translations,
) => {
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const fieldLabel = fields.find(
		(field) => "value" in column && field.key === column.value,
	)!.label;
	return `${translations.matchColumnsStep.matchDropdownTitle} ${fieldLabel} (${
		"matchedOptions" in column &&
		column.matchedOptions.filter((option) => !option.value).length
	} ${translations.matchColumnsStep.unmatched})`;
};

type TemplateColumnProps<T extends string> = {
	onChange: (val: T, index: number) => void;
	onSubChange: (val: T, index: number, option: string) => void;
	onColumnTypeChange?: (val: string, index: number) => void;
	column: Column<T>;
	columnTypes?: string[];
};

export const TemplateColumn = <T extends string>({
	column,
	onChange,
	onSubChange,
	onColumnTypeChange,
	columnTypes,
}: TemplateColumnProps<T>) => {
	const { translations, fields, allowCustomFields } = useRsi<T>();
	const styles = useStyleConfig("MatchColumnsStep") as Styles;
	const isIgnored = column.type === ColumnType.ignored;
	const isChecked =
		column.type === ColumnType.matched ||
		column.type === ColumnType.matchedCheckbox ||
		column.type === ColumnType.matchedSelectOptions;
	const isSelect = "matchedOptions" in column;
	const selectOptions: SelectOption[] = fields.map(
		({ label, key }: { label: string; key: string }) => ({ value: key, label }),
	);
	const selectValue: SelectOption | undefined = selectOptions.find(
		({ value }: { value: string }) =>
			// @ts-ignore - narrow at runtime
			"value" in column && column.value === value,
	);

	// Provide a per-column custom option to allow dynamic fields
	const CUSTOM_PREFIX = "__custom__:" as const;
	const headerLower = (column.header || "").toString().toLowerCase();
	const hasPredefinedLabelMatch = selectOptions.some(
		(o) => (o.label || "").toString().toLowerCase() === headerLower,
	);
	const isCustomSelected =
		// @ts-ignore - narrow at runtime
		"value" in column &&
		!selectOptions.some((o) => o.value === (column as { value: string }).value);
	const shouldShowCustomOption =
		!!allowCustomFields && !selectValue && !hasPredefinedLabelMatch;
	const customOption: SelectOption | undefined = shouldShowCustomOption
		? { label: column.header, value: `${CUSTOM_PREFIX}${column.header}` }
		: undefined;

	return (
		<Flex minH={10} w="100%" flexDir="column" justifyContent="center">
			{isIgnored ? (
				<Text sx={styles.selectColumn.text}>
					{translations.matchColumnsStep.ignoredColumnText}
				</Text>
			) : (
				<>
					<Flex alignItems="center" minH={10} w="100%">
						<Box flex={1}>
							<MatchColumnSelect
								placeholder={translations.matchColumnsStep.selectPlaceholder}
								value={isCustomSelected ? customOption : selectValue}
								onChange={(value) => onChange(value?.value as T, column.index)}
								options={selectOptions}
								name={column.header}
								customOption={customOption}
								defaultToCustomIfEmpty={
									!!customOption && column.type === ColumnType.empty
								}
							/>
						</Box>
						<MatchIcon isChecked={isChecked} />
					</Flex>
					{isCustomSelected && columnTypes && columnTypes.length > 1 ? (
						<Box mt={2}>
							<ChakraSelect
								placeholder={"Select type"}
								value={
									(column as { selectedColumnType?: string })
										.selectedColumnType || ""
								}
								onChange={(e) =>
									onColumnTypeChange?.(e.target.value, column.index)
								}
								size="sm"
							>
								{columnTypes.map((t: string) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</ChakraSelect>
						</Box>
					) : null}
					{isSelect && (
						<Flex width="100%">
							<Accordion allowMultiple width="100%">
								<AccordionItem border="none" py={1}>
									<AccordionButton
										_hover={{ bg: "transparent" }}
										_focus={{ boxShadow: "none" }}
										px={0}
										py={4}
										data-testid="accordion-button"
									>
										<AccordionIcon />
										<Box textAlign="left">
											<Text sx={styles.selectColumn.accordionLabel}>
												{getAccordionTitle<T>(fields, column, translations)}
											</Text>
										</Box>
									</AccordionButton>
									<AccordionPanel pb={4} pr={3} display="flex" flexDir="column">
										{column.matchedOptions.map((option) => (
											<SubMatchingSelect
												option={option}
												column={column}
												onSubChange={onSubChange}
												key={option.entry}
											/>
										))}
									</AccordionPanel>
								</AccordionItem>
							</Accordion>
						</Flex>
					)}
				</>
			)}
		</Flex>
	);
};
