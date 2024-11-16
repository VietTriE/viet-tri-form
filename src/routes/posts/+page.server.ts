
import type { Post } from '$lib/types.js';
import type { PageServerLoad } from './$types.js';

const POSTSTYPE = ["news", "services", "aboutUs", "projects"] as const;


export const load: PageServerLoad = async () => {
	try {
		const results: Record<string, Post[]> = {};

		await Promise.all(
			POSTSTYPE.map(async (postType) => {
				const response = await fetch(
					`https://viet_tri_api.mkt-viettri.workers.dev/api/posts/${postType}`
				);

				if (!response.ok) {
					throw new Error(`Failed to fetch ${postType}: HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				results[postType] = data as Post[];
			})
		);

		return {
			postTypes: POSTSTYPE,
			postsByType: results
		};
	} catch (error) {
		console.error('Error fetching products:', error);
		throw error; // SvelteKit will handle this error
	}
};