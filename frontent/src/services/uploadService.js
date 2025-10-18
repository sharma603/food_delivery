import api from './api';

export const uploadService = {
  uploadImage: async (file, type = 'general') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch(`${api.baseURL}/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },

  uploadMultipleImages: async (files, type = 'general') => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });
      formData.append('type', type);

      const response = await fetch(`${api.baseURL}/upload/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Multiple images upload failed:', error);
      throw error;
    }
  },

  deleteImage: async (imageUrl) => {
    try {
      return await api.delete(`/upload/image?url=${encodeURIComponent(imageUrl)}`);
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  },
};
