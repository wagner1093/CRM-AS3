export interface Contact {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  contact: Contact;
  channel: string;
  remote_jid: string;
  status: "new" | "open" | "waiting_customer" | "won" | "lost";
  ai_interest_label: "hot" | "warm" | "cold";
  ai_interest_score: number;
  ai_summary: string;
  last_message_at: string;
  source_channel?: string;
  source_campaign?: string;
  source_adset?: string;
  source_ad?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  text: string;
  sent_at: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  version: string | null;
  color: string | null;
  km: number | null;
  price: number;
  status: "available" | "reserved" | "sold" | "repasse";
  drive_folder_url: string | null;
  commission_percent: number;
  commission_value: number;
  notes: string | null;
}

export interface Deal {
  id: string;
  conversation_id: string;
  vehicle_interest_id: string | null;
  stage: string;
  payment_type: string;
  tradein_description: string | null;
  tradein_value_expected: number | null;
  next_action: string | null;
  next_action_at: string | null;
}

export interface FollowupSequence {
  id: string;
  name: string;
  trigger_type: string;
  active: boolean;
}

export interface FollowupStep {
  id: string;
  sequence_id: string;
  day_offset: number;
  message_template: string;
}

export interface FollowupEnrollment {
  id: string;
  conversation_id: string;
  sequence_id: string;
  status: "active" | "paused" | "completed" | "canceled";
  enrolled_at: string;
  last_sent_at: string | null;
}

export interface WaitlistProfile {
  id: string;
  contact_id: string;
  contact: Contact;
  status: "active" | "paused" | "converted" | "inactive";
  priority_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistPreferences {
  waitlist_id: string;
  body_type: "sedan" | "suv" | "hatch" | "pickup" | "wagon" | "indefinido";
  preferred_makes: string[] | null;
  preferred_models: string[] | null;
  min_year: number | null;
  max_year: number | null;
  min_price: number | null;
  max_price: number | null;
  must_have: string[] | null;
  avoid: string[] | null;
  payment_preference: "a_vista" | "financiamento" | "troca" | "misto" | "indefinido";
  has_kids: boolean | null;
  trunk_priority: number | null;
  updated_at: string;
}

export interface ModelSimilarity {
  id: string;
  model_key: string;
  similar_model_key: string;
  weight: number;
  created_at: string;
}

export interface WaitlistMatch {
  id: string;
  waitlist_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  match_score: number;
  match_reasons: {
    model_exact?: boolean;
    model_similar?: boolean;
    body_type?: boolean;
    price_ok?: boolean;
    year_ok?: boolean;
    must_have_hit?: boolean;
  };
  status: "suggested" | "contacted" | "dismissed" | "converted";
  created_at: string;
}

export interface WaitlistNotification {
  id: string;
  waitlist_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  message_text: string;
  sent_at: string;
  result: Record<string, unknown> | null;
}
