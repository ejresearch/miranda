export interface Project {
  name: string;
  description?: string;
  template?: string;
  created?: string;
}

export interface Template {
  name: string;
  description: string;
  default_buckets?: string[];
  default_tables?: Record<string, string[]>;
}

export interface CreateProjectRequest {
  name: string;
  template: string;
  description?: string;
  include_sample_data?: boolean;
}
