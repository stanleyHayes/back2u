import type {
  AdminStatsDTO,
  AiAssistInput,
  AiAssistResult,
  AuditLogDTO,
  PartnerStatsDTO,
  AuthResponse,
  AutocompleteResult,
  BookmarkDTO,
  BidDTO,
  ChatMessageDTO,
  ChatThreadDTO,
  CourierJobDTO,
  CourierRouteDTO,
  CreateCourierJobInput,
  CreateItemInput,
  CreateVaultEntryInput,
  CreateWebhookInput,
  TrustedFinderApplicationDTO,
  CreateZoneSubscriptionInput,
  CreateRedemptionInput,
  EmailPreferences,
  InstitutionDTO,
  InstitutionLeadDTO,
  SubscriptionPlanDTO,
  SubscriptionTier,
  RedemptionDTO,
  ItemDTO,
  ItemListQuery,
  LeaderboardEntryDTO,
  Locale,
  LoginInput,
  MarketplaceListingDTO,
  MarketplaceListingWithBidsDTO,
  MatchDTO,
  NotificationDTO,
  PartnerApiKeyDTO,
  CreatedPartnerApiKeyDTO,
  OwnershipVerificationDTO,
  Paginated,
  PlaceBidInput,
  PlaceSuggestionDTO,
  PoliceCaseRefDTO,
  QrTagDTO,
  QrTagProductDTO,
  QrTagOrderDTO,
  RegisterInput,
  ReviewDTO,
  RewardDTO,
  SendMessageInput,
  SocialShareCardDTO,
  SubmitInstitutionLeadInput,
  SubmitVerificationInput,
  UpdateItemInput,
  UpdateProfileInput,
  UpdateRewardsProfileInput,
  UpdateWebhookInput,
  UserDTO,
  VaultEntryDTO,
  WebhookDTO,
  ZoneSubscriptionDTO,
  FeatureFlagWithStatusDTO,
  FeatureFlagDTO,
  UpdateRolloutInput,
} from '@back2u/shared-types';

import { ApiClientError, type ApiClientOptions } from './types.js';

export class Back2uClient {
  private readonly baseUrl: string;
  private readonly getAccessToken: ApiClientOptions['getAccessToken'];
  private readonly getRefreshToken: ApiClientOptions['getRefreshToken'];
  private readonly onRefreshed: ApiClientOptions['onRefreshed'];
  private readonly onUnauthorized: ApiClientOptions['onUnauthorized'];
  private readonly fetchImpl: typeof fetch;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.getAccessToken = opts.getAccessToken;
    this.getRefreshToken = opts.getRefreshToken;
    this.onRefreshed = opts.onRefreshed;
    this.onUnauthorized = opts.onUnauthorized;
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  /** Escape hatch for niche integrations (service-worker bootstrap, generic raw calls). */
  raw<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.request<T>(method, path, body);
  }

  /** Single-flight silent refresh: concurrent 401s share one refresh attempt. */
  private tryRefresh(): Promise<boolean> {
    if (!this.getRefreshToken) return Promise.resolve(false);
    this.refreshPromise ??= (async () => {
      try {
        const refreshToken = await this.getRefreshToken!();
        if (!refreshToken) return false;
        const res = await this.fetchImpl(`${this.baseUrl}/v1/auth/refresh`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as {
          data?: { tokens?: { accessToken?: string; refreshToken?: string } };
        };
        const tokens = json.data?.tokens;
        if (!tokens?.accessToken || !tokens.refreshToken) return false;
        this.onRefreshed?.({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
        return true;
      } catch {
        return false;
      }
    })();
    return this.refreshPromise.finally(() => {
      this.refreshPromise = null;
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestInit,
    isRetry = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    };
    const token = await this.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      method,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const isAuthEndpoint = path.startsWith('/v1/auth/');
    if (res.status === 401 && !isAuthEndpoint) {
      if (!isRetry && (await this.tryRefresh())) {
        return this.request<T>(method, path, body, init, true);
      }
      this.onUnauthorized?.();
    }

    const text = await res.text();
    let json: { data?: T; error?: { code: string; message: string; details?: unknown } } = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        if (!res.ok) {
          throw new ApiClientError(res.status, 'unknown', res.statusText || 'Request failed');
        }
      }
    }

    if (!res.ok) {
      const err = json?.error ?? { code: 'unknown', message: res.statusText };
      throw new ApiClientError(res.status, err.code, err.message, err.details);
    }
    return json.data as T;
  }

  // ---- Auth ----
  register(input: RegisterInput) { return this.request<AuthResponse>('POST', '/v1/auth/register', input); }
  login(input: LoginInput) { return this.request<AuthResponse>('POST', '/v1/auth/login', input); }
  refresh(refreshToken: string) { return this.request<AuthResponse>('POST', '/v1/auth/refresh', { refreshToken }); }
  me() { return this.request<UserDTO>('GET', '/v1/auth/me'); }

  // ---- Me extras ----
  updateProfile(input: UpdateProfileInput) { return this.request<UserDTO>('PATCH', '/v1/me', input); }
  updateEmailPreferences(input: EmailPreferences) { return this.request<UserDTO>('PATCH', '/v1/me/preferences', input); }
  registerPushToken(token: string) { return this.request<{ ok: true }>('POST', '/v1/me/push-token', { token }); }
  setLocale(locale: Locale) { return this.request<{ ok: true }>('POST', '/v1/me/locale', { locale }); }
  redeemPoints(points: number) { return this.request<{ pointsBalance: number }>('POST', '/v1/me/redeem', { points }); }
  exportMyData() { return this.request<unknown>('GET', '/v1/me/export'); }
  describeImage(imageUrl: string) {
    return this.request<{ title: string; description: string; tags: string[] }>('POST', '/v1/me/ai/describe-image', { imageUrl });
  }
  aiAssist(input: AiAssistInput) {
    return this.request<AiAssistResult>('POST', '/v1/me/ai/assist', input);
  }

  // ---- Items ----
  autocompleteItems(q: string) { return this.request<AutocompleteResult>('GET', `/v1/items/autocomplete?q=${encodeURIComponent(q)}`); }
  searchPlaces(q: string, opts?: { limit?: number; lng?: number; lat?: number }) {
    const qs = new URLSearchParams({ q });
    if (opts?.limit) qs.set('limit', String(opts.limit));
    if (opts?.lng !== undefined && opts?.lat !== undefined) {
      qs.set('lng', String(opts.lng));
      qs.set('lat', String(opts.lat));
    }
    return this.request<PlaceSuggestionDTO[]>('GET', `/v1/geo/search?${qs.toString()}`);
  }
  createItem(input: CreateItemInput) { return this.request<ItemDTO>('POST', '/v1/items', input); }
  getItem(id: string) { return this.request<ItemDTO>('GET', `/v1/items/${encodeURIComponent(id)}`); }
  updateItem(id: string, input: UpdateItemInput) { return this.request<ItemDTO>('PATCH', `/v1/items/${encodeURIComponent(id)}`, input); }
  bumpItem(id: string) { return this.request<ItemDTO>('POST', `/v1/items/${encodeURIComponent(id)}/bump`); }
  listItems(query: ItemListQuery = {}) {
    const qs = new URLSearchParams();
    if (query.kind) qs.set('kind', query.kind);
    if (query.status) qs.set('status', query.status);
    if (query.category) qs.set('category', query.category);
    if (query.text) qs.set('text', query.text);
    if (query.search) qs.set('search', query.search);
    if (query.city) qs.set('city', query.city);
    if (query.dateFrom) qs.set('dateFrom', query.dateFrom);
    if (query.dateTo) qs.set('dateTo', query.dateTo);
    if (query.postedById) qs.set('postedById', query.postedById);
    if (query.page) qs.set('page', String(query.page));
    if (query.pageSize) qs.set('pageSize', String(query.pageSize));
    if (query.near) {
      qs.set('lng', String(query.near.lng));
      qs.set('lat', String(query.near.lat));
      qs.set('radius', String(query.near.radiusMeters));
    }
    return this.request<Paginated<ItemDTO>>('GET', `/v1/items?${qs.toString()}`);
  }

  // ---- Matches ----
  listMatchesForItem(itemId: string) { return this.request<MatchDTO[]>('GET', `/v1/items/${encodeURIComponent(itemId)}/matches`); }
  acceptMatch(matchId: string) { return this.request<MatchDTO>('POST', `/v1/matches/${encodeURIComponent(matchId)}/accept`); }
  rejectMatch(matchId: string) { return this.request<MatchDTO>('POST', `/v1/matches/${encodeURIComponent(matchId)}/reject`); }
  confirmItemReturn(matchId: string) { return this.request<MatchDTO>('POST', `/v1/matches/${encodeURIComponent(matchId)}/confirm-return`); }

  // ---- Chat ----
  listThreads() { return this.request<ChatThreadDTO[]>('GET', '/v1/chat/threads'); }
  getMessages(threadId: string) { return this.request<ChatMessageDTO[]>('GET', `/v1/chat/threads/${encodeURIComponent(threadId)}/messages`); }
  sendMessage(input: SendMessageInput) {
    return this.request<ChatMessageDTO>('POST', `/v1/chat/threads/${encodeURIComponent(input.threadId)}/messages`, { body: input.body, images: input.images });
  }
  markMessageRead(threadId: string, messageId: string) {
    return this.request<{ ok: true }>('POST', `/v1/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(messageId)}/read`);
  }
  sendTyping(threadId: string, typing: boolean) {
    return this.request<{ ok: true }>('POST', `/v1/chat/threads/${encodeURIComponent(threadId)}/typing`, { typing });
  }

  // ---- Rewards ----
  releaseReward(id: string, finderId: string) {
    return this.request<RewardDTO>('POST', `/v1/rewards/${encodeURIComponent(id)}/release`, { finderId });
  }

  // ---- Uploads ----
  getUploadSignature(folder: string) {
    return this.request<{ signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }>(
      'POST', '/v1/uploads/signature', { folder },
    );
  }

  // ---- Web Push ----
  getWebPushKey() { return this.request<{ vapidPublicKey: string | null }>('GET', '/v1/web-push/key'); }
  subscribeWebPush(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.request<{ ok: true }>('POST', '/v1/web-push/subscribe', sub);
  }
  unsubscribeWebPush(endpoint: string) {
    return this.request<{ ok: true }>('POST', '/v1/web-push/unsubscribe', { endpoint });
  }

  // ---- QR Tags ----
  listMyTags() { return this.request<QrTagDTO[]>('GET', '/v1/tags/mine'); }
  mintTags(count: number) { return this.request<QrTagDTO[]>('POST', '/v1/tags/mint', { count }); }
  claimTag(code: string, itemLabel?: string) { return this.request<QrTagDTO>('POST', '/v1/tags/claim', { code, itemLabel }); }
  getTagByCode(code: string) { return this.request<QrTagDTO>('GET', `/v1/tags/${encodeURIComponent(code)}`); }
  scanTag(code: string, finderMessage: string, finderEmail?: string) {
    return this.request<{ ownerName?: string; status: string }>(
      'POST', `/v1/tags/${encodeURIComponent(code)}/scan`, { finderMessage, finderEmail },
    );
  }
  sendTagHeartbeat(tagCode: string, lng: number, lat: number) {
    return this.request<{ received: true }>('POST', '/v1/tags/heartbeat', { tagCode, point: { lng, lat } });
  }
  markTagLost(code: string) { return this.request<QrTagDTO>('POST', `/v1/tags/${encodeURIComponent(code)}/lost`); }

  // ---- QR Tag Shop ----
  listTagProducts() { return this.request<QrTagProductDTO[]>('GET', '/v1/tags/products'); }
  createTagOrder(items: { productId: string; quantity: number }[]) {
    return this.request<QrTagOrderDTO>('POST', '/v1/tags/orders', { items });
  }
  payTagOrder(id: string) {
    return this.request<
      | { order: QrTagOrderDTO; tags: QrTagDTO[] }
      | { authorizationUrl: string; reference: string }
    >('POST', `/v1/tags/orders/${encodeURIComponent(id)}/pay`);
  }
  listMyTagOrders() { return this.request<QrTagOrderDTO[]>('GET', '/v1/tags/orders/my'); }

  // ---- Verifications ----
  getVerificationQuestions() {
    return this.request<{ id: string; prompt: string }[]>('GET', '/v1/verifications/questions');
  }
  submitVerification(input: SubmitVerificationInput) {
    return this.request<OwnershipVerificationDTO>('POST', '/v1/verifications', input);
  }
  decideVerification(id: string, decision: 'approve' | 'reject', note?: string) {
    return this.request<OwnershipVerificationDTO>('POST', `/v1/verifications/${encodeURIComponent(id)}/decide`, { decision, note });
  }
  listPendingVerifications() {
    return this.request<OwnershipVerificationDTO[]>('GET', '/v1/verifications/pending');
  }

  // ---- Courier ----
  requestCourierJob(input: CreateCourierJobInput) {
    return this.request<CourierJobDTO>('POST', '/v1/courier/jobs', input);
  }
  listOpenCourierJobs(near?: { lng: number; lat: number; radiusMeters: number }) {
    const qs = near ? `?lng=${near.lng}&lat=${near.lat}&radius=${near.radiusMeters}` : '';
    return this.request<CourierJobDTO[]>('GET', `/v1/courier/jobs/open${qs}`);
  }
  listNearbyCourierJobs(near: { lng: number; lat: number; radiusMeters?: number }) {
    const qs = new URLSearchParams();
    qs.set('lng', String(near.lng));
    qs.set('lat', String(near.lat));
    if (near.radiusMeters) qs.set('radius', String(near.radiusMeters));
    return this.request<CourierJobDTO[]>('GET', `/v1/courier/jobs/open/nearby?${qs.toString()}`);
  }
  calculateCourierRoute(input: { jobIds: string[]; riderLng?: number; riderLat?: number }) {
    return this.request<CourierRouteDTO>('POST', '/v1/courier/route', input);
  }
  listMyCourierJobs() { return this.request<CourierJobDTO[]>('GET', '/v1/courier/jobs/my'); }
  getCourierJob(id: string) { return this.request<CourierJobDTO>('GET', `/v1/courier/jobs/${encodeURIComponent(id)}`); }
  acceptCourierJob(id: string) { return this.request<CourierJobDTO>('POST', `/v1/courier/jobs/${encodeURIComponent(id)}/accept`); }
  transitionCourierJob(id: string, transition: 'pickup' | 'in_transit' | 'deliver' | 'cancel', code?: string) {
    return this.request<CourierJobDTO>('POST', `/v1/courier/jobs/${encodeURIComponent(id)}/transition`, { transition, code });
  }

  // ---- Vault ----
  listVault() { return this.request<VaultEntryDTO[]>('GET', '/v1/vault'); }
  createVaultEntry(input: CreateVaultEntryInput) { return this.request<VaultEntryDTO>('POST', '/v1/vault', input); }
  deleteVaultEntry(id: string) { return this.request<{ deleted: true }>('DELETE', `/v1/vault/${encodeURIComponent(id)}`); }

  // ---- Zones ----
  listZones() { return this.request<ZoneSubscriptionDTO[]>('GET', '/v1/zones'); }
  createZone(input: CreateZoneSubscriptionInput) { return this.request<ZoneSubscriptionDTO>('POST', '/v1/zones', input); }
  deleteZone(id: string) { return this.request<{ deleted: true }>('DELETE', `/v1/zones/${encodeURIComponent(id)}`); }

  // ---- Marketplace ----
  listMarketplace() { return this.request<MarketplaceListingDTO[]>('GET', '/v1/marketplace'); }
  getMarketplaceListing(id: string) { return this.request<MarketplaceListingWithBidsDTO>('GET', `/v1/marketplace/${encodeURIComponent(id)}`); }
  createListing(input: { itemId: string; startingPrice: number; buyNowPrice?: number; daysOpen?: number; charityRecipient?: string }) {
    return this.request<MarketplaceListingDTO>('POST', '/v1/marketplace', input);
  }
  placeBid(input: PlaceBidInput) {
    return this.request<BidDTO>('POST', `/v1/marketplace/${encodeURIComponent(input.listingId)}/bids`, { amount: input.amount });
  }
  listMyBids() {
    return this.request<BidDTO[]>('GET', '/v1/marketplace/bids/my');
  }
  closeMarketplaceListing(id: string) {
    return this.request<{ winnerId?: string; winningAmount: number }>('POST', `/v1/marketplace/${encodeURIComponent(id)}/close`);
  }

  // ---- Police ----
  generateStolenReport(itemId: string) {
    return this.request<PoliceCaseRefDTO>('POST', `/v1/police/items/${encodeURIComponent(itemId)}/report`);
  }
  filePoliceCase(id: string, caseNumber: string, station: string) {
    return this.request<PoliceCaseRefDTO>('POST', `/v1/police/cases/${encodeURIComponent(id)}/file`, { caseNumber, station });
  }

  // ---- Institutions ----
  listInstitutions() { return this.request<InstitutionDTO[]>('GET', '/v1/institutions'); }
  getInstitution(id: string) { return this.request<InstitutionDTO>('GET', `/v1/institutions/${encodeURIComponent(id)}`); }
  listRewardPartners(category?: string) {
    const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<InstitutionDTO[]>('GET', `/v1/institutions/rewards/partners${qs}`);
  }
  updateRewardsProfile(input: UpdateRewardsProfileInput) {
    return this.request<InstitutionDTO>('PATCH', '/v1/partner/rewards-profile', input);
  }
  getSubscriptionPlans() { return this.request<SubscriptionPlanDTO[]>('GET', '/v1/institutions/plans'); }
  subscribeInstitution(id: string, tier: SubscriptionTier) {
    return this.request<InstitutionDTO>('POST', `/v1/institutions/${encodeURIComponent(id)}/subscribe`, { tier });
  }
  onboardInstitution(input: {
    name: string;
    type: 'school' | 'airport' | 'transport' | 'event' | 'mall' | 'other';
    contactEmail: string;
    place: { name: string; lng: number; lat: number; city?: string; country?: string };
    pointsRedeemable?: boolean;
    pointToCurrencyRate?: number;
    webhookUrl?: string;
  }) {
    return this.request<{ institution: InstitutionDTO; apiKey: string }>('POST', '/v1/institutions', input);
  }
  submitInstitutionLead(input: SubmitInstitutionLeadInput) {
    return this.request<{ ok: true }>('POST', '/v1/institutions/leads', input);
  }
  listInstitutionLeads() {
    return this.request<InstitutionLeadDTO[]>('GET', '/v1/institutions/leads');
  }
  decideInstitutionLead(id: string, decision: 'contacted' | 'approved' | 'rejected') {
    return this.request<InstitutionLeadDTO>('POST', `/v1/institutions/leads/${encodeURIComponent(id)}/decide`, { decision });
  }

  // ---- Points redemption at institutions ----
  createRedemption(input: CreateRedemptionInput) {
    return this.request<RedemptionDTO>('POST', '/v1/redemptions', input);
  }
  listMyRedemptions() {
    return this.request<RedemptionDTO[]>('GET', '/v1/redemptions/mine');
  }
  confirmRedemption(code: string) {
    return this.request<RedemptionDTO>('POST', '/v1/redemptions/confirm', { code });
  }
  listInstitutionRedemptions(institutionId: string) {
    return this.request<RedemptionDTO[]>('GET', `/v1/redemptions/institution/${encodeURIComponent(institutionId)}`);
  }

  // ---- Leaderboard ----
  getLeaderboard(limit = 50) {
    return this.request<LeaderboardEntryDTO[]>('GET', `/v1/leaderboard?limit=${limit}`);
  }

  // ---- Share ----
  getShareCard(itemId: string) {
    return this.request<SocialShareCardDTO>('GET', `/v1/share/items/${encodeURIComponent(itemId)}/share-card`);
  }

  // ---- Admin ----
  getAdminStats() { return this.request<AdminStatsDTO>('GET', '/v1/admin/stats'); }

  // ---- Partner ----
  getPartnerStats() { return this.request<PartnerStatsDTO>('GET', '/v1/partner/stats'); }

  // ---- Partner API (public, API-key auth) ----
  listPartnerApiItems(query: ItemListQuery & { dateFrom?: string; dateTo?: string } = {}, apiKey: string) {
    const qs = new URLSearchParams();
    if (query.kind) qs.set('kind', query.kind);
    if (query.status) qs.set('status', query.status);
    if (query.dateFrom) qs.set('dateFrom', query.dateFrom);
    if (query.dateTo) qs.set('dateTo', query.dateTo);
    if (query.page) qs.set('page', String(query.page));
    if (query.pageSize) qs.set('pageSize', String(query.pageSize));
    return this.request<Paginated<ItemDTO>>('GET', `/partner/v1/items?${qs.toString()}`, undefined, {
      headers: { 'X-API-Key': apiKey },
    });
  }
  getPartnerApiItem(id: string, apiKey: string) {
    return this.request<ItemDTO>('GET', `/partner/v1/items/${encodeURIComponent(id)}`, undefined, {
      headers: { 'X-API-Key': apiKey },
    });
  }
  createPartnerApiItem(input: CreateItemInput, apiKey: string) {
    return this.request<ItemDTO>('POST', '/partner/v1/items', input, {
      headers: { 'X-API-Key': apiKey },
    });
  }
  updatePartnerApiItemStatus(id: string, status: string, apiKey: string) {
    return this.request<ItemDTO>('PATCH', `/partner/v1/items/${encodeURIComponent(id)}/status`, { status }, {
      headers: { 'X-API-Key': apiKey },
    });
  }
  getPartnerApiStats(apiKey: string) {
    return this.request<PartnerStatsDTO>('GET', '/partner/v1/stats', undefined, {
      headers: { 'X-API-Key': apiKey },
    });
  }

  // ---- Admin Partner API Keys ----
  createPartnerApiKey(institutionId: string, name: string) {
    return this.request<CreatedPartnerApiKeyDTO>('POST', '/v1/admin/partner-api-keys', { institutionId, name });
  }
  listPartnerApiKeys(institutionId?: string) {
    const qs = institutionId ? `?institutionId=${encodeURIComponent(institutionId)}` : '';
    return this.request<PartnerApiKeyDTO[]>('GET', `/v1/admin/partner-api-keys${qs}`);
  }
  revokePartnerApiKey(id: string) {
    return this.request<{ deleted: true }>('DELETE', `/v1/admin/partner-api-keys/${encodeURIComponent(id)}`);
  }

  // ---- Users (admin) ----
  listUsers(params: { limit?: number; offset?: number; search?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    if (params.search) qs.set('search', params.search);
    return this.request<UserDTO[]>('GET', `/v1/users?${qs.toString()}`);
  }
  updateUserStatus(id: string, status: string, reason?: string) {
    return this.request<UserDTO>('PATCH', `/v1/users/${encodeURIComponent(id)}/status`, { status, reason });
  }
  updateUserRoles(id: string, roles: string[]) {
    return this.request<UserDTO>('PATCH', `/v1/users/${encodeURIComponent(id)}/roles`, { roles });
  }

  // ---- Trusted Finder ----
  applyTrustedFinder(input: { idPhotoUrl: string; bio?: string }) {
    return this.request<TrustedFinderApplicationDTO>('POST', '/v1/trusted-finder/apply', input);
  }
  listTrustedFinderApplications(status?: 'pending' | 'approved' | 'rejected') {
    const qs = status ? `?status=${status}` : '';
    return this.request<TrustedFinderApplicationDTO[]>('GET', `/v1/trusted-finder/applications${qs}`);
  }
  decideTrustedFinderApplication(id: string, decision: 'approved' | 'rejected', reason?: string) {
    return this.request<{ application: TrustedFinderApplicationDTO; user?: UserDTO }>('POST', `/v1/trusted-finder/applications/${encodeURIComponent(id)}/decide`, { decision, reason });
  }

  // ---- Audit ----
  listAuditLogs(filter: { entity?: string; entityId?: string; actorId?: string; action?: string; dateFrom?: string; dateTo?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (filter.entity) qs.set('entity', filter.entity);
    if (filter.entityId) qs.set('entityId', filter.entityId);
    if (filter.actorId) qs.set('actorId', filter.actorId);
    if (filter.action) qs.set('action', filter.action);
    if (filter.dateFrom) qs.set('dateFrom', filter.dateFrom);
    if (filter.dateTo) qs.set('dateTo', filter.dateTo);
    if (filter.limit) qs.set('limit', String(filter.limit));
    return this.request<AuditLogDTO[]>('GET', `/v1/audit?${qs.toString()}`);
  }

  // ---- Auth (extra) ----
  requestPhoneOtp(phone: string) { return this.request<{ sent: true }>('POST', '/v1/auth/phone/request-otp', { phone }); }
  verifyPhoneOtp(phone: string, code: string) {
    return this.request<{ verified: true }>('POST', '/v1/auth/phone/verify', { phone, code });
  }
  requestEmailVerification() { return this.request<{ sent: true }>('POST', '/v1/auth/email/request-verification'); }
  confirmEmailVerification(code: string) {
    return this.request<{ verified: true }>('POST', '/v1/auth/email/confirm', { code });
  }
  requestPasswordReset(email: string) { return this.request<{ sent: true }>('POST', '/v1/auth/password/request-reset', { email }); }
  confirmPasswordReset(token: string, newPassword: string) {
    return this.request<{ ok: true }>('POST', '/v1/auth/password/confirm', { token, newPassword });
  }
  logout(refreshToken: string) { return this.request<{ ok: true }>('POST', '/v1/auth/logout', { refreshToken }); }

  // ---- Account ----
  exportAccount() { return this.request<unknown>('GET', '/v1/account/export'); }
  deleteAccount() {
    return this.request<{ deleted: true }>('DELETE', '/v1/account', { acknowledge: true });
  }

  // ---- Webhooks ----
  createWebhook(input: CreateWebhookInput) { return this.request<WebhookDTO>('POST', '/v1/webhooks', input); }
  listWebhooks() { return this.request<WebhookDTO[]>('GET', '/v1/webhooks'); }
  updateWebhook(id: string, input: UpdateWebhookInput) { return this.request<WebhookDTO>('PATCH', `/v1/webhooks/${encodeURIComponent(id)}`, input); }
  deleteWebhook(id: string) { return this.request<{ deleted: true }>('DELETE', `/v1/webhooks/${encodeURIComponent(id)}`); }

  // ---- Notifications ----
  listNotifications(limit = 50) { return this.request<NotificationDTO[]>('GET', `/v1/notifications?limit=${limit}`); }
  markNotificationRead(id: string) { return this.request<{ ok: true }>('POST', `/v1/notifications/${encodeURIComponent(id)}/read`); }
  markAllNotificationsRead() { return this.request<{ ok: true }>('POST', '/v1/notifications/read-all'); }
  getUnreadNotificationCount() { return this.request<{ count: number }>('GET', '/v1/notifications/unread-count'); }

  // ---- Bookmarks ----
  bookmarkItem(itemId: string) { return this.request<BookmarkDTO>('POST', '/v1/bookmarks', { itemId }); }
  unbookmarkItem(itemId: string) { return this.request<{ deleted: true }>('DELETE', `/v1/bookmarks/${encodeURIComponent(itemId)}`); }
  listBookmarks() { return this.request<BookmarkDTO[]>('GET', '/v1/bookmarks'); }

  // ---- Reviews ----
  createReview(input: { matchId: string; rating: number; comment?: string }) {
    return this.request<ReviewDTO>('POST', '/v1/reviews', input);
  }
  listReviewsForUser(userId: string, limit?: number) {
    const qs = limit ? `?limit=${limit}` : '';
    return this.request<ReviewDTO[]>('GET', `/v1/reviews/user/${encodeURIComponent(userId)}${qs}`);
  }
  getMyReviewForMatch(matchId: string) {
    return this.request<ReviewDTO | null>('GET', `/v1/reviews/match/${encodeURIComponent(matchId)}/mine`);
  }

  // ---- Safety ----
  listBlocks() { return this.request<{ blockedId: string; createdAt: string }[]>('GET', '/v1/safety/blocks'); }
  blockUser(blockedId: string) { return this.request<{ ok: true }>('POST', '/v1/safety/blocks', { blockedId }); }
  unblockUser(blockedId: string) { return this.request<{ ok: true }>('DELETE', `/v1/safety/blocks/${encodeURIComponent(blockedId)}`); }
  fileReport(input: {
    target: 'user' | 'item' | 'message' | 'listing';
    targetId: string;
    reason: 'scam' | 'harassment' | 'spam' | 'inappropriate' | 'other';
    note?: string;
  }) {
    return this.request<{ id: string }>('POST', '/v1/safety/reports', input);
  }
  listOpenReports() { return this.request<import('@back2u/shared-types').SafetyReportDTO[]>('GET', '/v1/safety/reports'); }
  decideReport(id: string, decision: 'action' | 'dismiss' | 'resolved', note?: string) {
    return this.request<{ ok: true }>('POST', `/v1/safety/reports/${encodeURIComponent(id)}/decide`, { decision, note });
  }

  // ---- Moderation ----
  listModerationQueue(filter: { type?: string; status?: string } = {}) {
    const qs = new URLSearchParams();
    if (filter.type) qs.set('type', filter.type);
    if (filter.status) qs.set('status', filter.status);
    return this.request<import('@back2u/shared-types').ModerationQueueItemDTO[]>('GET', `/v1/moderation/queue?${qs.toString()}`);
  }
  reviewModerationItem(id: string, decision: 'approve' | 'remove') {
    return this.request<{ ok: true }>('POST', `/v1/moderation/${encodeURIComponent(id)}/review`, { decision });
  }

  // ---- Feature Flags ----
  listFeatureFlags() { return this.request<FeatureFlagWithStatusDTO[]>('GET', '/v1/features'); }
  isFeatureEnabled(key: string) { return this.request<{ enabled: boolean }>('GET', `/v1/features/${encodeURIComponent(key)}/enabled`).then((r) => r.enabled); }
  toggleFeatureFlag(key: string) { return this.request<FeatureFlagDTO>('POST', `/v1/features/${encodeURIComponent(key)}/toggle`); }
  updateFeatureRollout(key: string, input: UpdateRolloutInput) { return this.request<FeatureFlagDTO>('POST', `/v1/features/${encodeURIComponent(key)}/rollout`, input); }
}
