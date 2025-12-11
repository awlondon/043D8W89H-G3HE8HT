export interface Lead {
  id: string;
  source: string;
  shopName: string;
  contactName: string;
  contactRole: string;
}

export interface CallLog {
  id: string;
  summary?: string;
  disposition?: string;
}
