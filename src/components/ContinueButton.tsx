import { Button, ModalFooter, useStyleConfig } from "@chakra-ui/react";
import type { themeOverrides } from "../theme";

type ContinueButtonProps = {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onContinue: (val: any) => void;
	onBack?: () => void;
	title: string;
	backTitle?: string;
	isLoading?: boolean;
	entityTitle?: string;
};

export const ContinueButton = ({
	onContinue,
	onBack,
	title,
	backTitle,
	isLoading,
	entityTitle,
}: ContinueButtonProps) => {
	const styles = useStyleConfig(
		"Modal",
	) as (typeof themeOverrides)["components"]["Modal"]["baseStyle"];
	const nextButtonMobileWidth = onBack ? "8rem" : "100%";

	// Format button title naturally by inserting entityTitle before action verbs
	let buttonTitle = title;
	if (entityTitle) {
		if (title.startsWith("Import")) {
			buttonTitle = title.replace("Import", `Import ${entityTitle} - `);
		}
	}
	return (
		<ModalFooter>
			{onBack && (
				<Button
					size="md"
					sx={styles.backButton}
					onClick={onBack}
					isLoading={isLoading}
					variant="link"
				>
					{backTitle}
				</Button>
			)}
			<Button
				size="lg"
				w={{ base: nextButtonMobileWidth, md: "21rem" }}
				sx={styles.continueButton}
				onClick={onContinue}
				isLoading={isLoading}
			>
				{buttonTitle}
			</Button>
		</ModalFooter>
	);
};
