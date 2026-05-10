const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const getModelInfo = () =>
  fetch(`${BACKEND_URL}/model`, {
    headers: {
      ...(import.meta.env.VITE_BACKEND_API_KEY && {
        'X-API-Key': import.meta.env.VITE_BACKEND_API_KEY,
      }),
    },
  })
    .then((res) => res.json())
    .then((data) => ({ name: data.name, version: data.version }));
