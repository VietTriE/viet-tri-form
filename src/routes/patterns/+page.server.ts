import type { PatternItem } from '$lib/types.js';
import type { PageServerLoad } from './$types.js';

const PATTERN_CATEGORIES = [
    'cabin',
    'cuaTang',
    'sanCabin',
    'tranGia',
    'tayVin',
    'hib',
    'hoaVanInox',
    'vatLieu'
] as const;

export const load: PageServerLoad = async () => {
    try {
        const results: Record<string, PatternItem[]> = {};

        await Promise.all(
            PATTERN_CATEGORIES.map(async (patternId) => {
                const response = await fetch(
                    `https://viet_tri_api.mkt-viettri.workers.dev/api/patterns/${patternId}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch ${patternId}: HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                results[patternId] = data as PatternItem[];
            })
        );

        return {
            categories: PATTERN_CATEGORIES,
            patternsByCategory: results
        };
    } catch (error) {
        console.error('Error fetching patterns:', error);
        throw error;
    }
};