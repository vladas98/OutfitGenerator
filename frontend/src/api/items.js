import apiClient from './client';

function guessMimeType(uri) {
  const ext = uri.split('.').pop().toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function uploadItemsBatch(assets) {
  const formData = new FormData();
  assets.forEach((asset, index) => {
    formData.append('images', {
      uri: asset.uri,
      name: asset.fileName || `item-${index}.jpg`,
      type: guessMimeType(asset.uri),
    });
  });

  const { data } = await apiClient.post('/api/items/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.items;
}

export async function listItems({ category, colorFamily } = {}) {
  const { data } = await apiClient.get('/api/items', { params: { category, colorFamily } });
  return data.items;
}

export async function getItem(id) {
  const { data } = await apiClient.get(`/api/items/${id}`);
  return data.item;
}

export async function updateItem(id, fields) {
  const { data } = await apiClient.patch(`/api/items/${id}`, fields);
  return data.item;
}

export async function deleteItem(id) {
  await apiClient.delete(`/api/items/${id}`);
}

// The user reviewed a suspected duplicate and wants to keep it anyway.
export async function dismissDuplicate(id) {
  const { data } = await apiClient.post(`/api/items/${id}/dismiss-duplicate`);
  return data.item;
}
