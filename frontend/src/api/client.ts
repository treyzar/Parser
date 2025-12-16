import axios from 'axios';
import type {
  Template,
  TemplateListItem,
  TemplateVersion,
  ShareLink,
  ParsedDocument,
  ShareInfo,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  RenderPayload,
  CreateShareLinkPayload,
} from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const templatesApi = {
  list: async (scope: 'public' | 'my' | 'shared' | 'all' = 'all'): Promise<TemplateListItem[]> => {
    const response = await api.get<TemplateListItem[]>('/templates/', { params: { scope } });
    return response.data;
  },

  get: async (id: number): Promise<Template> => {
    const response = await api.get<Template>(`/templates/${id}/`);
    return response.data;
  },

  create: async (data: CreateTemplatePayload): Promise<Template> => {
    const response = await api.post<Template>('/templates/', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTemplatePayload): Promise<Template> => {
    const response = await api.patch<Template>(`/templates/${id}/`, data);
    return response.data;
  },

  uploadDocx: async (id: number, file: File): Promise<Template> => {
    const formData = new FormData();
    formData.append('docx_file', file);
    const response = await api.patch<Template>(`/templates/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/templates/${id}/`);
  },

  getVersions: async (id: number): Promise<TemplateVersion[]> => {
    const response = await api.get<TemplateVersion[]>(`/templates/${id}/versions/`);
    return response.data;
  },

  restoreVersion: async (templateId: number, versionId: number): Promise<Template> => {
    const response = await api.post<Template>(`/templates/${templateId}/versions/restore/${versionId}/`);
    return response.data;
  },

  createShareLink: async (id: number, data: CreateShareLinkPayload = {}): Promise<ShareLink> => {
    const response = await api.post<ShareLink>(`/templates/${id}/share-links/`, data);
    return response.data;
  },

  render: async (id: number, data: RenderPayload): Promise<Blob> => {
    const response = await api.post(`/templates/${id}/render/`, data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const shareApi = {
  getInfo: async (token: string): Promise<ShareInfo> => {
    const response = await api.get<ShareInfo>(`/share/${token}/`);
    return response.data;
  },

  render: async (token: string, data: RenderPayload): Promise<Blob> => {
    const response = await api.post(`/share/${token}/render/`, data, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const parserApi = {
  parse: async (file: File): Promise<ParsedDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ParsedDocument>('/parse/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  get: async (id: number): Promise<ParsedDocument> => {
    const response = await api.get<ParsedDocument>(`/parse/${id}/`);
    return response.data;
  },
};

export default api;
