import { Conversation, Message, Vehicle, Deal, Contact, FollowupSequence, FollowupStep, FollowupEnrollment, WaitlistProfile, WaitlistPreferences, WaitlistMatch, WaitlistNotification, ModelSimilarity } from "@/types/crm";

export const mockContacts: Contact[] = [
  { id: "c1", full_name: "Carlos Silva", phone_e164: "+5511999001122", email: "carlos@email.com", created_at: "2025-03-01" },
  { id: "c2", full_name: "Ana Oliveira", phone_e164: "+5511988112233", email: null, created_at: "2025-03-02" },
  { id: "c3", full_name: "Pedro Santos", phone_e164: "+5511977223344", email: "pedro@gmail.com", created_at: "2025-03-03" },
  { id: "c4", full_name: "Maria Costa", phone_e164: "+5511966334455", email: null, created_at: "2025-03-04" },
  { id: "c5", full_name: "João Ferreira", phone_e164: "+5511955445566", email: "joao@email.com", created_at: "2025-03-05" },
  { id: "c6", full_name: "Lucia Mendes", phone_e164: "+5511944556677", email: null, created_at: "2025-03-06" },
];

export const mockVehicles: Vehicle[] = [
  { id: "v1", make: "Toyota", model: "Corolla", year: 2023, version: "XEi 2.0", color: "Prata", km: 18000, price: 125000, status: "available", drive_folder_url: "https://drive.google.com/folder1", commission_percent: 2, commission_value: 2500, notes: null },
  { id: "v2", make: "Honda", model: "Civic", year: 2024, version: "Touring", color: "Preto", km: 5000, price: 165000, status: "available", drive_folder_url: "https://drive.google.com/folder2", commission_percent: 2.5, commission_value: 4125, notes: null },
  { id: "v3", make: "Volkswagen", model: "T-Cross", year: 2023, version: "Highline", color: "Branco", km: 22000, price: 135000, status: "reserved", drive_folder_url: null, commission_percent: 2, commission_value: 2700, notes: "Cliente muito interessado" },
  { id: "v4", make: "Chevrolet", model: "Tracker", year: 2022, version: "Premier", color: "Cinza", km: 35000, price: 110000, status: "available", drive_folder_url: "https://drive.google.com/folder4", commission_percent: 3, commission_value: 3300, notes: null },
  { id: "v5", make: "Hyundai", model: "HB20", year: 2023, version: "Diamond Plus", color: "Vermelho", km: 12000, price: 89000, status: "sold", drive_folder_url: null, commission_percent: 2, commission_value: 1780, notes: null },
  { id: "v6", make: "Fiat", model: "Pulse", year: 2024, version: "Impetus", color: "Azul", km: 3000, price: 105000, status: "available", drive_folder_url: "https://drive.google.com/folder6", commission_percent: 2, commission_value: 2100, notes: null },
];

export const mockConversations: Conversation[] = [
  {
    id: "conv1", contact_id: "c1", contact: mockContacts[0], channel: "whatsapp", remote_jid: "5511999001122@s.whatsapp.net",
    status: "open", ai_interest_label: "hot", ai_interest_score: 92, ai_summary: "Cliente quer financiar Corolla 2023. Já tem aprovação bancária.",
    last_message_at: "2025-03-09T14:30:00Z", source_channel: "meta_ads", source_campaign: "Corolla Março",
  },
  {
    id: "conv2", contact_id: "c2", contact: mockContacts[1], channel: "whatsapp", remote_jid: "5511988112233@s.whatsapp.net",
    status: "open", ai_interest_label: "warm", ai_interest_score: 65, ai_summary: "Interessada no Civic, quer saber sobre troca do HB20 2021 dela.",
    last_message_at: "2025-03-09T13:15:00Z", source_channel: "instagram_org",
  },
  {
    id: "conv3", contact_id: "c3", contact: mockContacts[2], channel: "whatsapp", remote_jid: "5511977223344@s.whatsapp.net",
    status: "waiting_customer", ai_interest_label: "warm", ai_interest_score: 55, ai_summary: "Pediu informações sobre T-Cross, mas não respondeu última msg.",
    last_message_at: "2025-03-08T18:00:00Z", source_channel: "meta_ads", source_campaign: "SUV Março",
  },
  {
    id: "conv4", contact_id: "c4", contact: mockContacts[3], channel: "whatsapp", remote_jid: "5511966334455@s.whatsapp.net",
    status: "new", ai_interest_label: "cold", ai_interest_score: 20, ai_summary: "Perguntou preço do Tracker mas pareceu pesquisa inicial.",
    last_message_at: "2025-03-09T10:00:00Z", source_channel: "other",
  },
  {
    id: "conv5", contact_id: "c5", contact: mockContacts[4], channel: "whatsapp", remote_jid: "5511955445566@s.whatsapp.net",
    status: "won", ai_interest_label: "hot", ai_interest_score: 98, ai_summary: "Comprou HB20 Diamond Plus à vista. Negócio fechado.",
    last_message_at: "2025-03-07T16:45:00Z", source_channel: "meta_ads",
  },
  {
    id: "conv6", contact_id: "c6", contact: mockContacts[5], channel: "whatsapp", remote_jid: "5511944556677@s.whatsapp.net",
    status: "open", ai_interest_label: "hot", ai_interest_score: 85, ai_summary: "Quer Pulse Impetus, vai financiar. Pediu simulação.",
    last_message_at: "2025-03-09T15:00:00Z", source_channel: "meta_ads", source_campaign: "Fiat Março",
  },
];

export const mockMessages: Record<string, Message[]> = {
  conv1: [
    { id: "m1", conversation_id: "conv1", direction: "inbound", text: "Oi, vi o anúncio do Corolla 2023. Ainda está disponível?", sent_at: "2025-03-09T14:00:00Z" },
    { id: "m2", conversation_id: "conv1", direction: "outbound", text: "Olá Carlos! Sim, o Corolla XEi 2023 está disponível. Prata, 18 mil km, R$ 125.000. Gostaria de agendar uma visita?", sent_at: "2025-03-09T14:05:00Z" },
    { id: "m3", conversation_id: "conv1", direction: "inbound", text: "Quero financiar. Já tenho aprovação no Santander. Consigo 48x?", sent_at: "2025-03-09T14:15:00Z" },
    { id: "m4", conversation_id: "conv1", direction: "outbound", text: "Ótimo! Com aprovação Santander conseguimos sim. Vou preparar a simulação. Pode vir amanhã às 10h?", sent_at: "2025-03-09T14:20:00Z" },
    { id: "m5", conversation_id: "conv1", direction: "inbound", text: "Amanhã às 10h tá perfeito! Vou levar os documentos.", sent_at: "2025-03-09T14:30:00Z" },
  ],
  conv2: [
    { id: "m6", conversation_id: "conv2", direction: "inbound", text: "Boa tarde! Quanto tá o Civic Touring?", sent_at: "2025-03-09T12:30:00Z" },
    { id: "m7", conversation_id: "conv2", direction: "outbound", text: "Boa tarde Ana! O Civic Touring 2024 está R$ 165.000. Preto, 5 mil km. Lindo!", sent_at: "2025-03-09T12:35:00Z" },
    { id: "m8", conversation_id: "conv2", direction: "inbound", text: "Aceita troca? Tenho um HB20 2021, 40 mil km", sent_at: "2025-03-09T13:00:00Z" },
    { id: "m9", conversation_id: "conv2", direction: "outbound", text: "Aceitamos sim! Preciso avaliar o HB20. Pode trazer para avaliação?", sent_at: "2025-03-09T13:10:00Z" },
    { id: "m10", conversation_id: "conv2", direction: "inbound", text: "Vou ver minha agenda e te falo", sent_at: "2025-03-09T13:15:00Z" },
  ],
  conv6: [
    { id: "m11", conversation_id: "conv6", direction: "inbound", text: "Olá! Vi o Pulse Impetus azul. Lindo! Qual o valor?", sent_at: "2025-03-09T14:30:00Z" },
    { id: "m12", conversation_id: "conv6", direction: "outbound", text: "Oi Lucia! O Pulse Impetus 2024 azul está R$ 105.000. Apenas 3 mil km!", sent_at: "2025-03-09T14:35:00Z" },
    { id: "m13", conversation_id: "conv6", direction: "inbound", text: "Quero financiar, consigo entrada de 30 mil. Faz simulação pra mim?", sent_at: "2025-03-09T15:00:00Z" },
  ],
};

export const mockDeals: Deal[] = [
  { id: "d1", conversation_id: "conv1", vehicle_interest_id: "v1", stage: "financing", payment_type: "financiamento", tradein_description: null, tradein_value_expected: null, next_action: "Agendar visita amanhã 10h", next_action_at: "2025-03-10T10:00:00Z" },
  { id: "d2", conversation_id: "conv2", vehicle_interest_id: "v2", stage: "tradein_eval", payment_type: "troca", tradein_description: "HB20 2021 40mil km", tradein_value_expected: 62000, next_action: "Aguardar agendamento avaliação", next_action_at: null },
  { id: "d3", conversation_id: "conv3", vehicle_interest_id: "v3", stage: "qualified", payment_type: "indefinido", tradein_description: null, tradein_value_expected: null, next_action: "Follow-up: sem resposta há 1 dia", next_action_at: "2025-03-09T18:00:00Z" },
  { id: "d4", conversation_id: "conv4", vehicle_interest_id: "v4", stage: "new", payment_type: "indefinido", tradein_description: null, tradein_value_expected: null, next_action: null, next_action_at: null },
  { id: "d5", conversation_id: "conv5", vehicle_interest_id: "v5", stage: "won", payment_type: "a_vista", tradein_description: null, tradein_value_expected: null, next_action: null, next_action_at: null },
  { id: "d6", conversation_id: "conv6", vehicle_interest_id: "v6", stage: "negotiation", payment_type: "financiamento", tradein_description: null, tradein_value_expected: null, next_action: "Enviar simulação financiamento", next_action_at: "2025-03-09T16:00:00Z" },
];

export const mockSequences: FollowupSequence[] = [
  { id: "seq1", name: "Boas-vindas Meta Ads", trigger_type: "manual", active: true },
  { id: "seq2", name: "Sem resposta 48h", trigger_type: "no_reply", active: true },
  { id: "seq3", name: "Pós-visita", trigger_type: "stage_change", active: false },
];

export const mockSteps: FollowupStep[] = [
  { id: "st1", sequence_id: "seq1", day_offset: 0, message_template: "Olá {nome}! Vi que você se interessou pelo {carro}. Posso ajudar?" },
  { id: "st2", sequence_id: "seq1", day_offset: 1, message_template: "{nome}, o {carro} por {preco} é uma oportunidade única! Quer agendar visita?" },
  { id: "st3", sequence_id: "seq1", day_offset: 3, message_template: "{nome}, última chance! O {carro} está com muita procura." },
  { id: "st4", sequence_id: "seq2", day_offset: 0, message_template: "Oi {nome}, tudo bem? Vi que não conseguimos conversar. Posso te ajudar com algo?" },
  { id: "st5", sequence_id: "seq2", day_offset: 2, message_template: "{nome}, o {carro} ainda está disponível. Quer marcar uma visita?" },
];

export const mockEnrollments: FollowupEnrollment[] = [
  { id: "e1", conversation_id: "conv3", sequence_id: "seq2", status: "active", enrolled_at: "2025-03-08T18:00:00Z", last_sent_at: "2025-03-08T18:00:00Z" },
  { id: "e2", conversation_id: "conv4", sequence_id: "seq1", status: "active", enrolled_at: "2025-03-09T10:00:00Z", last_sent_at: null },
];

export const PIPELINE_STAGES = [
  { key: "new", label: "Novo", color: "bg-muted" },
  { key: "qualified", label: "Qualificado", color: "bg-info/10" },
  { key: "negotiation", label: "Negociação", color: "bg-warning/10" },
  { key: "tradein_eval", label: "Avaliação Troca", color: "bg-accent/20" },
  { key: "financing", label: "Financiamento", color: "bg-info/10" },
  { key: "scheduled", label: "Agendado", color: "bg-success/10" },
  { key: "docs", label: "Documentação", color: "bg-muted" },
  { key: "won", label: "Ganho ✅", color: "bg-success/20" },
  { key: "lost", label: "Perdido ❌", color: "bg-destructive/10" },
] as const;

export const mockModelSimilarity: ModelSimilarity[] = [
  { id: "ms1", model_key: "corolla", similar_model_key: "civic", weight: 90, created_at: "2025-01-01" },
  { id: "ms2", model_key: "corolla", similar_model_key: "sentra", weight: 80, created_at: "2025-01-01" },
  { id: "ms3", model_key: "corolla", similar_model_key: "city", weight: 70, created_at: "2025-01-01" },
  { id: "ms4", model_key: "civic", similar_model_key: "corolla", weight: 90, created_at: "2025-01-01" },
  { id: "ms5", model_key: "civic", similar_model_key: "sentra", weight: 75, created_at: "2025-01-01" },
  { id: "ms6", model_key: "t-cross", similar_model_key: "tracker", weight: 85, created_at: "2025-01-01" },
  { id: "ms7", model_key: "tracker", similar_model_key: "t-cross", weight: 85, created_at: "2025-01-01" },
  { id: "ms8", model_key: "pulse", similar_model_key: "t-cross", weight: 70, created_at: "2025-01-01" },
];

export const mockWaitlistProfiles: WaitlistProfile[] = [
  {
    id: "wl1", contact_id: "c3", contact: mockContacts[2],
    status: "active", priority_score: 85,
    notes: "Tem filhos, precisa de porta-malas grande. Prefere carro econômico para uso urbano.",
    created_at: "2025-03-03", updated_at: "2025-03-08",
  },
  {
    id: "wl2", contact_id: "c4", contact: mockContacts[3],
    status: "active", priority_score: 60,
    notes: "Primeiro carro, orçamento apertado. Quer algo confiável.",
    created_at: "2025-03-04", updated_at: "2025-03-07",
  },
  {
    id: "wl3", contact_id: "c2", contact: mockContacts[1],
    status: "paused", priority_score: 70,
    notes: "Está avaliando troca do HB20 por sedan maior. Não tem pressa.",
    created_at: "2025-03-02", updated_at: "2025-03-06",
  },
];

export const mockWaitlistPreferences: Record<string, WaitlistPreferences> = {
  wl1: {
    waitlist_id: "wl1", body_type: "suv", preferred_makes: ["volkswagen", "chevrolet"],
    preferred_models: ["t-cross", "tracker"], min_year: 2022, max_year: 2025,
    min_price: 90000, max_price: 140000, must_have: ["porta_malas_grande", "familia", "economico"],
    avoid: ["manual"], payment_preference: "financiamento", has_kids: true, trunk_priority: 9, updated_at: "2025-03-08",
  },
  wl2: {
    waitlist_id: "wl2", body_type: "hatch", preferred_makes: ["hyundai", "fiat"],
    preferred_models: ["hb20", "pulse"], min_year: 2021, max_year: 2025,
    min_price: 60000, max_price: 110000, must_have: ["economico"],
    avoid: null, payment_preference: "financiamento", has_kids: false, trunk_priority: 3, updated_at: "2025-03-07",
  },
  wl3: {
    waitlist_id: "wl3", body_type: "sedan", preferred_makes: ["toyota", "honda"],
    preferred_models: ["corolla", "civic"], min_year: 2022, max_year: 2025,
    min_price: 100000, max_price: 180000, must_have: ["porta_malas_grande"],
    avoid: null, payment_preference: "troca", has_kids: false, trunk_priority: 7, updated_at: "2025-03-06",
  },
};

export const mockWaitlistMatches: WaitlistMatch[] = [
  {
    id: "wm1", waitlist_id: "wl1", vehicle_id: "v3", vehicle: mockVehicles[2], match_score: 92,
    match_reasons: { model_exact: true, body_type: true, price_ok: true, year_ok: true, must_have_hit: true },
    status: "suggested", created_at: "2025-03-08",
  },
  {
    id: "wm2", waitlist_id: "wl1", vehicle_id: "v4", vehicle: mockVehicles[3], match_score: 78,
    match_reasons: { model_exact: false, model_similar: true, body_type: true, price_ok: true, year_ok: true, must_have_hit: false },
    status: "contacted", created_at: "2025-03-07",
  },
  {
    id: "wm3", waitlist_id: "wl2", vehicle_id: "v6", vehicle: mockVehicles[5], match_score: 75,
    match_reasons: { model_exact: false, model_similar: true, body_type: false, price_ok: true, year_ok: true, must_have_hit: true },
    status: "suggested", created_at: "2025-03-09",
  },
  {
    id: "wm4", waitlist_id: "wl3", vehicle_id: "v1", vehicle: mockVehicles[0], match_score: 88,
    match_reasons: { model_exact: true, body_type: true, price_ok: true, year_ok: true, must_have_hit: true },
    status: "suggested", created_at: "2025-03-09",
  },
  {
    id: "wm5", waitlist_id: "wl3", vehicle_id: "v2", vehicle: mockVehicles[1], match_score: 82,
    match_reasons: { model_exact: true, model_similar: false, body_type: true, price_ok: true, year_ok: true, must_have_hit: true },
    status: "suggested", created_at: "2025-03-09",
  },
];

export const mockWaitlistNotifications: WaitlistNotification[] = [
  {
    id: "wn1", waitlist_id: "wl1", vehicle_id: "v4", vehicle: mockVehicles[3],
    message_text: "Oi Pedro, tudo bem? Chegou um Tracker Premier 2022 que parece bem com o que você estava buscando. Quer que eu te mande mais detalhes e condições?",
    sent_at: "2025-03-07T14:30:00Z", result: { status: "delivered" },
  },
];

export const defaultMessageTemplate = "Oi {nome}, tudo bem? Chegou um {modelo} {ano} que parece bem com o que você estava buscando. Quer que eu te mande mais detalhes e condições?";
