export interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: "US";
}

export interface Parcel {
  weight: number; 
  length: number; 
  width: number; 
  height: number;
}

export interface CreateLabelRequest {
  from_address: Address;
  to_address: Address;
  parcel: Parcel;
}

export interface CreateLabelResponse {
  label_url: string;
  tracking_code?: string;
}
