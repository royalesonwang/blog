export interface Subscribe {
  id?: number;
  name: string;
  email: string;
  created_at?: string;
  content: string[];
  status?: string;
  plan?: string;
  uuid?: string;
}

export interface SubscribeRequest {
  name: string;
  email: string;
  content: string[];
}
