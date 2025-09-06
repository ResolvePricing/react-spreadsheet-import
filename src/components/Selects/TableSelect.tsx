import { rootId } from "../Providers";
import { Select } from "chakra-react-select";
import type { SelectOption } from "../../types";
import { useStyleConfig } from "@chakra-ui/react";
import type { themeOverrides } from "../../theme";

interface Props {
	onChange: (value: SelectOption | null) => void;
	value?: SelectOption;
	options: readonly SelectOption[];
	name?: string;
}

export const TableSelect = ({ onChange, value, options, name }: Props) => {
	const styles = useStyleConfig(
		"ValidationStep",
	) as (typeof themeOverrides)["components"]["ValidationStep"]["baseStyle"];
	return (
		<Select<SelectOption, false>
			autoFocus
			useBasicStyles
			size="sm"
			value={value}
			onChange={onChange}
			placeholder=" "
			closeMenuOnScroll
			menuPosition="fixed"
			menuIsOpen
			menuPortalTarget={document.getElementById(rootId)}
			options={options}
			chakraStyles={styles.select}
			aria-label={name}
			name={name}
			inputId={name}
			instanceId={name}
		/>
	);
};
