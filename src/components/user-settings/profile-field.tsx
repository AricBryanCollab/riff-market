import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BodyLarge, BodySmall } from "@/components/ui/typography";

interface ProfileInfoFieldProps {
	label: string;
	value: string | null;
	description?: string;
	icon: LucideIcon;
}

export function ProfileInfoField({
	label,
	value,
	description,
	icon: Icon,
}: ProfileInfoFieldProps) {
	return (
		<div className="flex min-w-0 gap-3 rounded-md border border-border bg-background px-4 py-3">
			<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				<Icon size={16} />
			</div>
			<div className="min-w-0">
				<BodySmall className="font-semibold text-muted-foreground">
					{label}
				</BodySmall>
				<BodyLarge className="mt-1 break-words text-base">
					{value || <span className="text-muted-foreground">Not provided</span>}
				</BodyLarge>
				{description && (
					<Badge variant="secondary" className="mt-2">
						{description}
					</Badge>
				)}
			</div>
		</div>
	);
}
