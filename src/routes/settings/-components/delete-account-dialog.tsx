import { Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { BodyLarge, BodySmall } from "@/components/ui/typography";
import useDeleteUser from "@/hooks/use-delete-user";
import type { UserProfile } from "@/types/user";

const DELETE_ACCOUNT_CONFIRMATION_ID = "delete-account-confirmation";
const DELETE_ACCOUNT_CONFIRMATION_DESCRIPTION_ID =
	"delete-account-confirmation-description";

export function DeleteAccountDialog({ user }: { user: UserProfile }) {
	const [emailConfirmation, setEmailConfirmation] = useState("");
	const { handleDeleteUser, loadingDeleteUser } = useDeleteUser();
	const isConfirmed = emailConfirmation === user.email;
	const hasConfirmationMismatch = emailConfirmation.length > 0 && !isConfirmed;

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!isConfirmed) return;

		handleDeleteUser(user.email);
	};

	return (
		<form onSubmit={handleSubmit}>
			<FieldGroup className="gap-5">
				<div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
					<BodyLarge className="text-base text-destructive">
						This action cannot be undone.
					</BodyLarge>
					<BodySmall className="mt-2 text-muted-foreground leading-6">
						Deleting the account permanently removes profile settings and
						marketplace activity tied to this sign-in.
					</BodySmall>
				</div>
				<Field data-invalid={hasConfirmationMismatch ? true : undefined}>
					<FieldLabel htmlFor={DELETE_ACCOUNT_CONFIRMATION_ID}>
						Confirm account email
					</FieldLabel>
					<Input
						id={DELETE_ACCOUNT_CONFIRMATION_ID}
						value={emailConfirmation}
						onChange={(event) => setEmailConfirmation(event.target.value)}
						placeholder={user.email}
						aria-describedby={DELETE_ACCOUNT_CONFIRMATION_DESCRIPTION_ID}
						aria-invalid={hasConfirmationMismatch || undefined}
					/>
					<FieldDescription id={DELETE_ACCOUNT_CONFIRMATION_DESCRIPTION_ID}>
						Type {user.email} to confirm permanent account deletion.
					</FieldDescription>
					{hasConfirmationMismatch && (
						<FieldError>Email does not match this account.</FieldError>
					)}
				</Field>
				<div className="flex justify-end">
					<LoadingButton
						type="submit"
						variant="destructive"
						loading={loadingDeleteUser}
						disabled={!isConfirmed}
					>
						<Trash2 data-icon="inline-start" />
						Delete Account
					</LoadingButton>
				</div>
			</FieldGroup>
		</form>
	);
}
