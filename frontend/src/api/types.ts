export type TemplateType = 'HTML' | 'DOCX';
export type VisibilityType = 'PUBLIC' | 'RESTRICTED';

export interface ShareLink {
  id: number;
  token: string;
  ttl_days: number;
  max_uses: number;
  current_uses: number;
  is_valid: boolean;
  expires_at: string;
  created_at: string;
}

export interface TemplateVersion {
  id: number;
  version_number: number;
  html_content: string;
  docx_file: string | null;
  created_at: string;
}

export interface Template {
  id: number;
  title: string;
  description: string;
  template_type: TemplateType;
  visibility: VisibilityType;
  owner_id: number;
  allowed_users: number[];
  html_content: string;
  docx_file: string | null;
  placeholders: string[];
  share_links: ShareLink[];
  latest_version: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: number;
  title: string;
  description: string;
  template_type: TemplateType;
  visibility: VisibilityType;
  owner_id: number;
  placeholders: string[];
  created_at: string;
  updated_at: string;
}

export interface ParsedDocument {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  page_count: number | null;
  extracted_text: string;
  original_file: string;
  created_at: string;
}

export interface ShareInfo {
  id: number;
  title: string;
  description: string;
  template_type: TemplateType;
  placeholders: string[];
  share_link: ShareLink;
}

export interface CreateTemplatePayload {
  title: string;
  description?: string;
  template_type: TemplateType;
  visibility?: VisibilityType;
  html_content?: string;
  allowed_users?: number[];
}

export interface UpdateTemplatePayload {
  title?: string;
  description?: string;
  visibility?: VisibilityType;
  html_content?: string;
  allowed_users?: number[];
}

export interface RenderPayload {
  values: Record<string, string>;
}

export interface CreateShareLinkPayload {
  ttl_days?: number;
  max_uses?: number;
}
