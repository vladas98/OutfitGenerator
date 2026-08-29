import apiClient from './client';

/**
 * @param {string} occasion
 * @param {object} [options]
 * @param {string[]} [options.seedItemIds] - items the outfit must include
 * @param {string[]} [options.excludeItemIds] - items to leave out (e.g. one being replaced)
 */
export async function generateOutfit(occasion, { seedItemIds = [], excludeItemIds = [] } = {}) {
  const { data } = await apiClient.post('/api/outfits/generate', {
    occasion,
    seedItemIds,
    excludeItemIds,
  });
  return data.outfit;
}

export async function listOutfits() {
  const { data } = await apiClient.get('/api/outfits');
  return data.outfits;
}

export async function listSavedOutfits() {
  const { data } = await apiClient.get('/api/outfits/saved');
  return data.outfits;
}

// The user thinks the outfit suits a different occasion than it was built for.
export async function updateOutfitOccasion(outfitId, occasion) {
  const { data } = await apiClient.patch(`/api/outfits/${outfitId}`, { occasion });
  return data.outfit;
}

export async function unsaveOutfit(outfitId) {
  const { data } = await apiClient.post(`/api/outfits/${outfitId}/unsave`);
  return data.outfit;
}
