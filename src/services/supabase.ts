import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, SaaSMetrics } from '../types';

const CONFIG_KEY = 'hisab_supabase_config';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: '',
    anonKey: '',
    isConnected: false,
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        this.config = JSON.parse(saved);
        if (this.config.url && this.config.anonKey) {
          this.initClient();
        }
      } else {
        // Check for Vite environment variables
        const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
        const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
        if (envUrl && envKey) {
          this.config = {
            url: envUrl,
            anonKey: envKey,
            isConnected: false,
          };
          this.initClient();
        }
      }
    } catch (e) {
      console.warn('Could not load Supabase config:', e);
    }
  }

  private initClient(): void {
    if (this.config.url && this.config.anonKey) {
      try {
        this.client = createClient(this.config.url, this.config.anonKey);
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
        this.client = null;
      }
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public async saveConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    this.config.url = url.trim();
    this.config.anonKey = anonKey.trim();

    if (!this.config.url || !this.config.anonKey) {
      this.config.isConnected = false;
      this.client = null;
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
      return { success: true, message: 'Supabase configuration cleared. Running in local-first mode.' };
    }

    try {
      this.initClient();
      if (!this.client) {
        throw new Error('Invalid credentials format');
      }

      // Test connection with a lightweight query or auth check
      const { error } = await this.client.from('businesses').select('count', { count: 'exact', head: true });
      
      // Even if table doesn't exist yet, if network connects it means URL and key are valid
      this.config.isConnected = !error || error.code === 'PGRST116' || error.message.includes('relation');
      this.config.lastConnectedAt = new Date().toISOString();
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));

      return {
        success: true,
        message: 'Successfully connected to Supabase Free Tier project!',
      };
    } catch (e: any) {
      this.config.isConnected = false;
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
      return {
        success: false,
        message: e?.message || 'Failed to connect to Supabase. Check URL and anon key.',
      };
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isConnected(): boolean {
    return this.config.isConnected && this.client !== null;
  }
}

export const supabaseService = new SupabaseService();
