
import type { Product } from '$lib/types.js';
import type { PageServerLoad } from './$types.js';

const CATEGORIES = [
	'thangTaiKhach',
	'thangTaiHang',
	'thangTaiOTo',
	'thangThucPham',
	'thangQuanSat',
	'thangTaiGiuongBenh',
	'thangTaiRac',
	'toiTaiHang'
] as const;


export const load: PageServerLoad = async () => {
	try {
		const results: Record<string, Product[]> = {};

		await Promise.all(
			CATEGORIES.map(async (categoryId) => {
				const response = await fetch(
					`https://viet_tri_api.mkt-viettri.workers.dev/api/products/${categoryId}`
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch ${categoryId}: HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				results[categoryId] = data as Product[];
			})
		);

		return {
			categories: CATEGORIES,
			productsByCategory: results
		};
	} catch (error) {
		console.error('Error fetching products:', error);
		throw error; // SvelteKit will handle this error
	}
};