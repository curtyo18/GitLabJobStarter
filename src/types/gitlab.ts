export interface GitLabJob {
  id: number;
  name: string;
  status: string;
}

export interface GitLabBridge {
  id: number;
  name: string;
  downstream_pipeline?: {
    id: number;
  };
}
