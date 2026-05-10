const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const getModelInfo = () =>
  fetch(`${BACKEND_URL}/model`)
    .then((res) => res.json())
    .then((data) => ({ name: data.name, version: data.version }));
