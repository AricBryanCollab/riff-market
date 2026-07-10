const MIN_INITIAL_STOCK = 1;

export function isValidInitialStock(stock: number): boolean {
	return Number.isSafeInteger(stock) && stock >= MIN_INITIAL_STOCK;
}
