/**
 * Parser for Epic Games order/transaction JSON
 */

export interface EpicOrderItem {
	description: string;
	quantity: number;
	amount: number;
	currency: string;
	offerId: string;
	namespace: string;
	giftRecipient: string;
}

export interface EpicOrder {
	orderType: string;
	orderId: string;
	createdAtMillis: number;
	items: EpicOrderItem[];
	marketplaceName: string;
	total: {
		amount: number;
		currency: string;
	};
}

export interface ParsedGame {
	title: string;
	epicOfferId: string;
	orderId: string;
	purchaseDate: Date;
	price: number;
	currency: string;
}

/**
 * Parse Epic Games order JSON and extract game information
 * @param json - Raw JSON string (single order or array of orders)
 * @returns Array of parsed games with deduplicated offer IDs
 */
export function parseEpicOrders(json: string): ParsedGame[] {
	const data = JSON.parse(json);
	const orders: EpicOrder[] = Array.isArray(data) ? data : [data];

	const games: ParsedGame[] = [];
	const seenOfferIds = new Set<string>();

	for (const order of orders) {
		if (!order.items || !Array.isArray(order.items)) {
			continue;
		}

		for (const item of order.items) {
			const offerId = item.offerId?.trim();
			const title = item.description?.trim();

			if (!offerId || !title || seenOfferIds.has(offerId)) {
				continue;
			}

			seenOfferIds.add(offerId);
			games.push({
				title,
				epicOfferId: offerId,
				orderId: order.orderId,
				purchaseDate: new Date(order.createdAtMillis),
				price: item.amount / 100,
				currency: item.currency,
			});
		}
	}

	return games;
}

/**
 * Extract Epic offer IDs from orders
 * @param json - Raw JSON string
 * @returns Array of unique Epic offer IDs
 */
export function extractOfferIds(json: string): string[] {
	return parseEpicOrders(json).map((game) => game.epicOfferId);
}
