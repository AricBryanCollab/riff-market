import type { ReactNode } from "react";
import { BodySmall, H4 } from "@/components/ui/typography";

type SettingsPanelTone = "default" | "warning";

const panelToneClass: Record<SettingsPanelTone, string> = {
	default: "border-border",
	warning: "border-destructive/30",
};

interface SettingsPanelProps {
	children: ReactNode;
	description: string;
	title: string;
	tone?: SettingsPanelTone;
}

export function SettingsPanel({
	children,
	description,
	title,
	tone = "default",
}: SettingsPanelProps) {
	return (
		<section className={`border-t pt-6 ${panelToneClass[tone]}`}>
			<div className="grid gap-5 lg:grid-cols-[12rem_minmax(0,1fr)]">
				<div>
					<H4 className="text-lg tracking-normal">{title}</H4>
					<BodySmall className="mt-2 text-muted-foreground leading-6">
						{description}
					</BodySmall>
				</div>
				{children}
			</div>
		</section>
	);
}
