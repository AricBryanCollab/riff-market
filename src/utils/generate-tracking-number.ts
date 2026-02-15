export function generateTrackingNumber() {
	return `RIFF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
