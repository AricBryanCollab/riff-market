import { BodyLarge, BodySmall, Caption } from "@/components/ui/typography";

interface ProfileInfoFieldProps {
	label: string;
	value: string | null;
	description?: string;
}

export function ProfileInfoField({
	label,
	value,
	description,
}: ProfileInfoFieldProps) {
	return (
		<div className="flex flex-col gap-2">
			<BodySmall className="font-semibold tracking-wide">{label}</BodySmall>
			<BodyLarge className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2">
				{value || <span className="text-slate-500">Not Provided</span>}
			</BodyLarge>
			{description && (
				<Caption className="text-secondary">{description}</Caption>
			)}
		</div>
	);
}
