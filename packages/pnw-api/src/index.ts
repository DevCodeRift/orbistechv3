import pnwkit from 'pnwkit';
import { decryptApiKey } from '@orbistech/encryption';

export class PnWApiClient {
  private apiKey: string;
  private pnwKit: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.pnwKit = pnwkit;
    this.pnwKit.setKey(apiKey);
  }

  static async fromEncrypted(encryptedApiKey: string): Promise<PnWApiClient> {
    const apiKey = await decryptApiKey(encryptedApiKey);
    return new PnWApiClient(apiKey);
  }

  async validateApiKey(): Promise<{ valid: boolean; error?: string; userInfo?: any }> {
    try {
      const response = await this.pnwKit.query(`
        query {
          me {
            nation_id
            nation_name
            alliance_id
            alliance {
              id
              name
            }
          }
        }
      `);

      if (response?.data?.me) {
        return {
          valid: true,
          userInfo: response.data.me
        };
      } else {
        return { valid: false, error: 'Invalid API key or no user data' };
      }
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getAllianceData(allianceId: number) {
    return this.pnwKit.allianceQuery(
      { id: [allianceId], first: 1 },
      `id name acronym founded members {
        id nation_name leader_name cities score
        last_active discord discord_id
        alliance_position alliance_position_id
      }`
    );
  }

  async getNationData(nationId: number) {
    return this.pnwKit.nationQuery(
      { id: [nationId], first: 1 },
      `id nation_name leader_name alliance {
        id name
      } cities score color continent
      last_active date soldiers tanks aircraft ships
      discord discord_id vacation_mode_turns beige_turns`
    );
  }

  async searchNations(query: string) {
    return Promise.all([
      this.pnwKit.nationQuery(
        { nation_name: [query], first: 5 },
        `id nation_name leader_name alliance { name } score`
      ),
      this.pnwKit.nationQuery(
        { leader_name: [query], first: 5 },
        `id nation_name leader_name alliance { name } score`
      )
    ]);
  }

  async getWars(filters: {
    allianceId?: number;
    nationId?: number;
    active?: boolean;
    limit?: number;
  }) {
    const queryFilters: any = { first: filters.limit || 50 };

    if (filters.allianceId) {
      queryFilters.alliance_id = [filters.allianceId];
    }
    if (filters.nationId) {
      queryFilters.or_id = [filters.nationId];
    }
    if (filters.active !== undefined) {
      queryFilters.active = filters.active;
    }

    return this.pnwKit.warQuery(
      queryFilters,
      `id attacker_id defender_id attacker { nation_name } defender { nation_name }
       war_type date turns_left winner att_points def_points`
    );
  }
}

export default PnWApiClient;