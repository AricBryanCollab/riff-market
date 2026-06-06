import { RotateCcw, Save } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { BodyLarge, BodySmall } from "@/components/ui/typography";
import { themeOptions } from "@/constants/select-options";
import { SettingsPanel } from "./settings-panel";

interface ThemeSectionProps {
	loadingUpdateTheme: boolean;
	onClearTheme: () => void;
	onThemeSelectChange: (value: string) => void;
	onUpdateTheme: () => void;
	previewTheme: string | null;
	savedThemeLabel: string;
	selectedThemeLabel: string;
	themeValue: string;
}

export function ThemeSection({
	loadingUpdateTheme,
	onClearTheme,
	onThemeSelectChange,
	onUpdateTheme,
	previewTheme,
	savedThemeLabel,
	selectedThemeLabel,
	themeValue,
}: ThemeSectionProps) {
	return (
		<SettingsPanel
			title="Theme"
			description="Choose the theme you want to use across RiffMarket."
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<BodyLarge className="text-base">{selectedThemeLabel}</BodyLarge>
						<Badge variant={previewTheme ? "outline" : "secondary"}>
							{previewTheme ? "Preview" : "Saved"}
						</Badge>
					</div>
					<BodySmall className="mt-2 max-w-xl text-muted-foreground leading-6">
						{previewTheme
							? `${selectedThemeLabel} is selected. Saved theme remains ${savedThemeLabel}.`
							: `${savedThemeLabel} is saved across your account.`}
					</BodySmall>
				</div>

				<div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
					<FormSelect
						options={themeOptions.map((theme) => ({
							label: theme.label,
							value: theme.value,
						}))}
						onValueChange={onThemeSelectChange}
						value={themeValue}
						className="my-0 w-full md:w-48"
					/>
					{previewTheme && (
						<div className="flex flex-col gap-2 sm:flex-row">
							<LoadingButton
								loading={loadingUpdateTheme}
								className="w-full sm:w-fit"
								onClick={onUpdateTheme}
							>
								<Save data-icon="inline-start" />
								Save
							</LoadingButton>
							<Button
								variant="outline"
								className="w-full sm:w-fit"
								onClick={onClearTheme}
							>
								<RotateCcw data-icon="inline-start" />
								Cancel
							</Button>
						</div>
					)}
				</div>
			</div>
		</SettingsPanel>
	);
}
