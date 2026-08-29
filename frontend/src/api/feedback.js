import apiClient from './client';

export async function submitFeedback(outfitId, liked, reason) {
  const { data } = await apiClient.post('/api/feedback', { outfitId, liked, reason });
  return data.feedback;
}
