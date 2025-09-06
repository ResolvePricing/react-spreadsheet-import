import { Select, chakraComponents } from "chakra-react-select";
import type { ValueContainerProps, GroupBase } from "chakra-react-select";
import type { SelectOption } from "../../types";
import { customComponents } from "./MenuPortal";
import { useStyleConfig } from "@chakra-ui/react";
import type { SystemStyleObject } from "@chakra-ui/react";
import type { Styles } from "../../steps/MatchColumnsStep/components/ColumnGrid";
import Logo from "../Logo";
interface Props {
	onChange: (value: SelectOption | null) => void;
	value?: SelectOption;
	options: readonly SelectOption[];
	placeholder?: string;
	name?: string;
}

export const MatchColumnSelect = ({
	onChange,
	value,
	options,
	placeholder,
	name,
}: Props) => {
	const styles = useStyleConfig("MatchColumnsStep") as Styles;
	// Convert snake_case labels to Title Case (e.g., "snake_case" -> "Snake Case")
	const toTitleFromSnake = (label: string) =>
		label
			.split("_")
			.filter((part) => part.length > 0)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
			.join(" ");

	const transformedOptions = options.map((opt) => ({
		...opt,
		label: opt.label.includes("_") ? toTitleFromSnake(opt.label) : opt.label,
	}));

	// Ensure selected value references the transformed option object
	const transformedValue = value
		? transformedOptions.find((opt) => opt.value === value.value) || value
		: null;

	// Prefix the input with the Resolve logo inside the value container
	const ValueContainer = (
		props: ValueContainerProps<SelectOption, false, GroupBase<SelectOption>>,
	) => (
		<chakraComponents.ValueContainer {...props}>
			<Logo
				width={16}
				height={16}
				// fill="red"
				// stroke="red"
				style={{
					marginRight: 4,
					flex: "0 0 auto",
					color: !props.hasValue
						? "var(--chakra-colors-chakra-placeholder-color)"
						: "currentColor",
				}}
			/>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					flex: "1 1 auto",
					minWidth: 0,
					overflow: "hidden",
					fontSize: "var(--chakra-fontSizes-sm)",
					lineHeight: "var(--chakra-lineHeights-4)",
					textTransform: "uppercase",
					// fontWeight: "var(--chakra-fontWeights-)",
					letterSpacing: "var(--chakra-letterSpacings-wider)",
				}}
			>
				{props.children}
			</div>
		</chakraComponents.ValueContainer>
	);

	const components = { ...customComponents, ValueContainer } as const;

	const chakraStyles = {
		...styles.select,
		valueContainer: (provided: SystemStyleObject) => {
			return {
				...provided,
				display: "flex",
				alignItems: "center",
				flexWrap: "nowrap",
				gap: 0,
				overflow: "hidden",
				minWidth: 0,
			};
		},
		placeholder: (provided: SystemStyleObject) => ({
			...provided,
			// margin: 0,
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			overflow: "hidden",
			// backgroundColor: "red",
		}),
		singleValue: (provided: SystemStyleObject) => ({
			...provided,
			// margin: 0,
			// maxWidth: "100%",
			// flex: "1 1 auto",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
			overflow: "hidden",
		}),
		inputContainer: (provided: SystemStyleObject) => ({
			...provided,
			flex: "1 1 auto",
			minWidth: 0,
			overflow: "hidden",
		}),
		input: (provided: SystemStyleObject) => ({
			...provided,
			margin: 0,
			padding: 0,
			// width: 0,
			// minWidth: 0,
			flex: "0 0 auto",
		}),
	} as const;
	return (
		<Select<SelectOption, false>
			value={transformedValue}
			colorScheme="gray"
			useBasicStyles
			onChange={onChange}
			placeholder={placeholder}
			options={transformedOptions}
			chakraStyles={chakraStyles}
			menuPosition="fixed"
			components={components}
			aria-label={name}
			name={name}
			inputId={name}
			instanceId={name}
			isClearable
			escapeClearsValue
		/>
	);
};
