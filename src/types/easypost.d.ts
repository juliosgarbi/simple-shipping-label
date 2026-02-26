declare module "@easypost/api" {
  interface Rate {
    id: string;
    carrier: string;
    rate: string;
    [key: string]: unknown;
  }

  interface PostageLabel {
    label_url?: string;
    [key: string]: unknown;
  }

  interface ShipmentInstance {
    id?: string;
    rates?: Rate[];
    postage_label?: PostageLabel;
    tracking_code?: string;
    lowestRate?(carriers?: string[]): Rate | undefined;
    save(): Promise<this>;
    buy(rate: Rate): Promise<this>;
  }

  interface ShipmentConstructor {
    new (params: {
      from_address: Record<string, unknown>;
      to_address: Record<string, unknown>;
      parcel: Record<string, unknown>;
    }): ShipmentInstance;
  }

  interface EasyPostClient {
    Shipment: ShipmentConstructor;
  }

  export default class EasyPost {
    constructor(apiKey: string);
    Shipment: ShipmentConstructor;
  }
}
