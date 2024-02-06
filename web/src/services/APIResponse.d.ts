interface APIError {
  code: number;
  response: string;
}

interface APIResponseDataID {
  id: string;
  updated: NullString;
}

interface APIResponse<T> {
  dataHash: string;
  dataIDs: APIResponseDataID[];
  dataTotal: number;
  dataType: string;
  dataValue: T;
  message: string;
  requestID: string;
  status: number;
  success: boolean;
}

interface APIHeader {
  [key: string]: string;
}

interface APIQuery {
  [index: string]: null | number | string | undefined;
  filter?: string;
  from?: NullString;
  offset?: number;
  to?: NullString;
}
