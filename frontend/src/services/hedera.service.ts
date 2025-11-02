import {
  Client,
  TopicId,
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk";

let hederaClient: Client | null = null;

export interface HederaConfig {
  accountId: string;
  privateKey: string;
  topicId: string;
  farmId?: string;
}

export interface HederaReceipt {
  success: boolean;
  topic_id?: string;
  sequence?: number;
  error?: string;
}

function parsePrivateKey(privateKey: string): PrivateKey {
  let keyString = privateKey;
  if (keyString.startsWith("0x")) {
    keyString = keyString.substring(2);
  }
  return PrivateKey.fromStringECDSA(keyString);
}

export class HederaService {
  private client: Client;
  private topicId: TopicId;
  private farmId: string;

  constructor(config: HederaConfig) {
    const operatorId = AccountId.fromString(config.accountId);
    const operatorKey = parsePrivateKey(config.privateKey);

    this.client = Client.forTestnet();
    this.client.setOperator(operatorId, operatorKey);
    this.topicId = TopicId.fromString(config.topicId);
    this.farmId = config.farmId || "TUTELA-DEMO-001";
  }

  async submitMessage(message: object): Promise<HederaReceipt> {
    try {
      const fullMessage = JSON.stringify({
        farm_id: this.farmId,
        location: "Lagos, Nigeria",
        ...message,
      });

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(fullMessage);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      console.log("✅ Message logged to Hedera");

      return {
        success: true,
        topic_id: this.topicId.toString(),
        sequence: Number(receipt.topicSequenceNumber),
      };
    } catch (error) {
      console.error("❌ Hedera logging failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getTopicId(): string {
    return this.topicId.toString();
  }

  static getSharedClient(): Client | null {
    return hederaClient;
  }

  static initializeSharedClient(config: HederaConfig): Client {
    if (!hederaClient) {
      const operatorId = AccountId.fromString(config.accountId);
      const operatorKey = parsePrivateKey(config.privateKey);

      hederaClient = Client.forTestnet();
      hederaClient.setOperator(operatorId, operatorKey);
    }
    return hederaClient;
  }

  static isConfigured(): boolean {
    return !!(
      process.env.HEDERA_ACCOUNT_ID &&
      process.env.HEDERA_PRIVATE_KEY &&
      process.env.HEDERA_TOPIC_ID
    );
  }

  static async checkConnection(): Promise<"connected" | "disabled" | "error"> {
    if (!HederaService.isConfigured()) {
      return "disabled";
    }

    try {
      HederaService.initializeSharedClient({
        accountId: process.env.HEDERA_ACCOUNT_ID!,
        privateKey: process.env.HEDERA_PRIVATE_KEY!,
        topicId: process.env.HEDERA_TOPIC_ID!,
      });
      return "connected";
    } catch {
      return "error";
    }
  }
}

export function createHederaService(): HederaService | null {
  if (!HederaService.isConfigured()) {
    return null;
  }

  return new HederaService({
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    topicId: process.env.HEDERA_TOPIC_ID!,
    farmId: process.env.FARM_ID,
  });
}
