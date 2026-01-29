import { formatDistanceToNow } from "date-fns";

export function formatRelativeTime(date: Date | string) {
	if (date === "NaN") {
		return "NaN";
	}

	return formatDistanceToNow(new Date(date), { addSuffix: true });
}
