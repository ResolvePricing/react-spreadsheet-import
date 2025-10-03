import {
	AlertDialog,
	AlertDialogBody,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogOverlay,
	Button,
} from "@chakra-ui/react";
import { useRef } from "react";
import { useRsi } from "../../hooks/useRsi";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const SubmitDataAlert = ({ isOpen, onClose, onConfirm }: Props) => {
	const { allowInvalidSubmit, translations } = useRsi();
	const cancelRef = useRef<HTMLButtonElement | null>(null);

	return (
		<AlertDialog
			isOpen={isOpen}
			onClose={onClose}
			// @ts-expect-error
			leastDestructiveRef={cancelRef}
			isCentered
			id="rsi"
		>
			<AlertDialogOverlay>
				<AlertDialogContent>
					<AlertDialogHeader fontSize="lg" fontWeight="bold">
						{translations.alerts.submitIncomplete.headerTitle}
					</AlertDialogHeader>
					<AlertDialogBody>
						{allowInvalidSubmit
							? translations.alerts.submitIncomplete.bodyText
							: translations.alerts.submitIncomplete.bodyTextSubmitForbidden}
					</AlertDialogBody>
					<AlertDialogFooter>
						{allowInvalidSubmit ? (
							<Button ref={cancelRef} onClick={onClose} variant="secondary">
								{translations.alerts.submitIncomplete.cancelButtonTitle}
							</Button>
						) : (
							<Button ref={cancelRef} onClick={onClose}>
								{translations.alerts.submitIncomplete.fixErrorsButtonTitle}
							</Button>
						)}
						{allowInvalidSubmit ? (
							<Button onClick={onConfirm} ml={3}>
								{translations.alerts.submitIncomplete.finishButtonTitle}
							</Button>
						) : null}
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogOverlay>
		</AlertDialog>
	);
};
