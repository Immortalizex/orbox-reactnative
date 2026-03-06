import { getStoredToken, setStoredToken, clearStoredToken } from '../lib/appParams';
import { appParams, loadAppParams } from '../lib/appParams';

let cachedToken = null;

export async function getToken() {
  if (cachedToken) return cachedToken;
  cachedToken = await getStoredToken();
  return cachedToken;
}

export async function setToken(token) {
  cachedToken = token;
  if (token) await setStoredToken(token);
  else await clearStoredToken();
}

function getBaseUrl() {
  const base = appParams.appBaseUrl || '/api';
  if (base.startsWith('http')) return base.replace(/\/$/, '');
  if (typeof global !== 'undefined' && global.__API_BASE__) {
    return global.__API_BASE__.replace(/\/$/, '');
  }
  return base;
}

/** Normalize JWT: strip all whitespace (fixes copy-paste or encoding issues that break verification) */
function normalizeToken(t) {
  if (!t || typeof t !== 'string') return null;
  const s = String(t).replace(/\s/g, '').trim();
  return s.length > 20 && (s.startsWith('eyJ') || s.length > 50) ? s : null;
}

async function request(path, options = {}) {
  const base = getBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  // Always read token from storage first; normalize (strip whitespace) so JWT verification succeeds
  let token = await getStoredToken();
  if (token) token = normalizeToken(token) || String(token).replace(/\s/g, '').trim() || null;
  if (token) cachedToken = token;
  if (!token) token = normalizeToken(await getToken()) || null;
  const headers = {
    'Content-Type': 'application/json',
    ...(appParams.appId ? { 'X-App-Id': appParams.appId } : {}),
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try {
      err.data = await res.json();
    } catch {
      err.data = { message: await res.text() };
    }
    throw err;
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return res.json();
  return res.text();
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.data)) return data.data;
  return [];
}

function buildQuery(params, sort, limit) {
  const search = new URLSearchParams();
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') search.set(k, String(v));
    });
  }
  if (sort) search.set('sort', sort);
  if (limit != null) search.set('limit', String(limit));
  const q = search.toString();
  return q ? `?${q}` : '';
}

function createEntity(name) {
  return {
    async list(sort, limit) {
      const q = buildQuery({}, sort, limit);
      const data = await request(`/entities/${name}${q}`);
      return asArray(data);
    },
    async filter(filters = {}, sort, limit) {
      const q = buildQuery(filters, sort, limit);
      const data = await request(`/entities/${name}${q}`);
      return asArray(data);
    },
    async create(data) {
      return request(`/entities/${name}`, { method: 'POST', body: JSON.stringify(data) });
    },
    async update(id, data) {
      return request(`/entities/${name}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    async delete(id) {
      return request(`/entities/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
}

/** Coerce to number when value is a numeric string (backend often returns decimals as strings) */
function toNum(v) {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/** Normalize backend (camelCase) to include snake_case for app compatibility */
function normalizeBox(b) {
  if (!b) return b;
  const pricePerHour = toNum(b.pricePerHour ?? b.price_per_hour);
  const lat = toNum(b.latitude);
  const lng = toNum(b.longitude);
  return {
    ...b,
    price_per_hour: pricePerHour ?? b.price_per_hour,
    pricePerHour,
    latitude: lat ?? b.latitude,
    longitude: lng ?? b.longitude,
    image_url: b.imageUrl ?? b.image_url,
    opening_hours: b.openingHours ?? b.opening_hours,
    zip_code: b.zipCode ?? b.zip_code,
    created_at: b.createdAt ?? b.created_at,
    updated_at: b.updatedAt ?? b.updated_at,
    access_tolerance_minutes: b.accessToleranceMinutes ?? b.access_tolerance_minutes,
    lock_api_url: b.lockApiUrl ?? b.lock_api_url,
    lock_api_key: b.lockApiKey ?? b.lock_api_key,
  };
}

function normalizeReservation(r) {
  if (!r) return r;
  const box = r.box ? normalizeBox(r.box) : undefined;
  const amount = r.totalAmount ?? r.total_amount;
  return {
    ...r,
    box_id: r.boxId ?? r.box_id,
    user_id: r.userId ?? r.user_id,
    personal_id: r.personalId ?? r.personal_id,
    start_time: r.startTime ?? r.start_time,
    end_time: r.end_time ?? r.endTime,
    total_amount: amount,
    total_price: typeof amount === 'string' ? parseFloat(amount) : amount,
    payment_id: r.paymentId ?? r.payment_id,
    created_at: r.createdAt ?? r.created_at,
    updated_at: r.updatedAt ?? r.updated_at,
    box,
    box_name: r.box?.name ?? box?.name,
  };
}

function normalizePersonal(p) {
  if (!p) return p;
  return {
    ...p,
    user_id: p.userId ?? p.user_id,
    price_per_session: p.pricePerSession ?? p.price_per_session,
    avatar_url: p.avatarUrl ?? p.avatar_url,
    created_at: p.createdAt ?? p.created_at,
    updated_at: p.updatedAt ?? p.updated_at,
  };
}

/** Backend (NestJS) API – used when appBaseUrl points to real backend */
const backend = {
  boxes: {
    async list(params = {}) {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.city) q.set('city', params.city);
      if (params.lat) q.set('lat', params.lat);
      if (params.lng) q.set('lng', params.lng);
      if (params.radiusKm) q.set('radiusKm', params.radiusKm);
      const query = q.toString() ? `?${q.toString()}` : '';
      const data = await request(`/boxes${query}`);
      const arr = Array.isArray(data) ? data : asArray(data);
      return arr.map(normalizeBox);
    },
    async get(id) {
      const b = await request(`/boxes/${encodeURIComponent(id)}`);
      return normalizeBox(b);
    },
    async create(body) {
      const b = await request('/boxes', { method: 'POST', body: JSON.stringify(body) });
      return normalizeBox(b);
    },
    async update(id, body) {
      const b = await request(`/boxes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return normalizeBox(b);
    },
  },
  reservations: {
    async my(status) {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await request(`/reservations/my${query}`);
      const arr = Array.isArray(data) ? data : asArray(data);
      return arr.map(normalizeReservation);
    },
    async create(dto) {
      const body = {
        boxId: dto.boxId ?? dto.box_id,
        personalId: dto.personalId ?? dto.personal_id,
        date: dto.date,
        startTime: dto.startTime ?? dto.start_time,
        endTime: dto.endTime ?? dto.end_time,
        type: dto.type || 'Solo',
      };
      const r = await request('/reservations', { method: 'POST', body: JSON.stringify(body) });
      return normalizeReservation(r);
    },
    async get(id) {
      const r = await request(`/reservations/${encodeURIComponent(id)}`);
      return normalizeReservation(r);
    },
    async cancel(id) {
      const r = await request(`/reservations/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      return normalizeReservation(r);
    },
  },
  personals: {
    async list(params = {}) {
      const q = new URLSearchParams();
      if (params.level) q.set('level', params.level);
      if (params.approved !== undefined) q.set('approved', String(params.approved));
      const query = q.toString() ? `?${q.toString()}` : '';
      const data = await request(`/personals${query}`);
      const arr = Array.isArray(data) ? data : asArray(data);
      return arr.map(normalizePersonal);
    },
    async get(id) {
      const p = await request(`/personals/${encodeURIComponent(id)}`);
      return normalizePersonal(p);
    },
    async create(body) {
      const p = await request('/personals', { method: 'POST', body: JSON.stringify(body) });
      return normalizePersonal(p);
    },
    async update(id, body) {
      const p = await request(`/personals/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return normalizePersonal(p);
    },
  },
  supportTickets: {
    async my() {
      const data = await request('/support-tickets/my');
      return Array.isArray(data) ? data : asArray(data);
    },
    async create(dto) {
      return request('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: dto.subject,
          message: dto.message,
          category: dto.category || 'general',
        }),
      });
    },
    async adminList(params = {}) {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.category) q.set('category', params.category);
      if (params.sort) q.set('sort', params.sort);
      if (params.limit != null) q.set('limit', String(params.limit));
      const query = q.toString();
      const data = await request(`/support-tickets${query ? `?${query}` : ''}`);
      return Array.isArray(data) ? data : asArray(data);
    },
    async adminUpdate(id, dto) {
      return request(`/support-tickets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: dto.status, response: dto.response }),
      });
    },
  },
  access: {
    async requestOpen(reservationId) {
      return request('/access/request-open', {
        method: 'POST',
        body: JSON.stringify({ reservationId }),
      });
    },
    async validateCode(code, boxId) {
      return request('/access/validate', {
        method: 'POST',
        body: JSON.stringify({ code, boxId }),
      });
    },
  },
};

function useBackend() {
  const base = appParams.appBaseUrl || '/api';
  return typeof base === 'string' && base.startsWith('http');
}

async function authRequest(path, body) {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try {
      err.data = await res.json();
    } catch {
      err.data = { message: await res.text() };
    }
    throw err;
  }
  return res.json();
}

export const api = {
  auth: {
    async me() {
      return request('/auth/me');
    },
    async login(email, password) {
      const data = await authRequest('/auth/login', { email, password });
      const payload = data.data ?? data;
      const token = payload.accessToken ?? payload.access_token ?? payload.token ?? data.accessToken ?? data.access_token ?? data.token;
      const user = payload.user ?? data.user ?? data;
      const tokenStr = token ? (String(token).replace(/\s/g, '').trim() || null) : null;
      if (tokenStr && tokenStr.length > 20) {
        cachedToken = tokenStr;
        await setStoredToken(tokenStr);
      }
      return user;
    },
    async signup(cpf, phone, email, password, full_name) {
      const body = { cpf, phone, email, password };
      if (full_name != null && full_name.trim() !== '') body.full_name = full_name.trim();
      const data = await authRequest('/auth/signup', body);
      const payload = data.data ?? data;
      const token = payload.accessToken ?? payload.access_token ?? payload.token ?? data.accessToken ?? data.access_token ?? data.token;
      const user = payload.user ?? data.user ?? data;
      const tokenStr = token ? (String(token).replace(/\s/g, '').trim() || null) : null;
      if (tokenStr && tokenStr.length > 20) {
        cachedToken = tokenStr;
        await setStoredToken(tokenStr);
      }
      return user;
    },
    async logout() {
      await setToken(null);
    },
    async updateProfile({ name, photo_url, phone }) {
      const body = {};
      if (name !== undefined) body.name = name;
      if (photo_url !== undefined) body.photo_url = photo_url;
      if (phone !== undefined) body.phone = phone;
      return request('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) });
    },
  },
  payments: {
    async create({ reservationId, amount, method }) {
      if (!useBackend()) throw new Error('Pagamento disponível apenas com o backend.');
      return request('/payments', {
        method: 'POST',
        body: JSON.stringify({
          reservationId,
          amount: typeof amount === 'string' ? parseFloat(amount) : amount,
          method: method === 'credit_card' ? 'card' : method || 'pix',
        }),
      });
    },
  },
  access: {
    async requestOpen(reservationId) {
      if (!useBackend()) throw new Error('Abrir box por QR disponível apenas com o backend.');
      return backend.access.requestOpen(reservationId);
    },
  },
  entities: {
    Box: (() => {
      const generic = createEntity('Box');
      return {
        async list(sort, limit) {
          if (useBackend()) return backend.boxes.list({});
          return generic.list(sort, limit);
        },
        async filter(filters = {}, sort, limit) {
          if (useBackend()) {
            if (filters.id) {
              const b = await backend.boxes.get(filters.id);
              return b ? [b] : [];
            }
            return backend.boxes.list({ status: filters.status, city: filters.city, lat: filters.lat, lng: filters.lng, radiusKm: filters.radiusKm });
          }
          return generic.filter(filters, sort, limit);
        },
        async create(data) {
          if (useBackend()) return backend.boxes.create(data);
          return generic.create(data);
        },
        async update(id, data) {
          if (useBackend()) return backend.boxes.update(id, data);
          return generic.update(id, data);
        },
        async delete(id) {
          return generic.delete(id);
        },
      };
    })(),
    Booking: (() => {
      const generic = createEntity('Booking');
      return {
        async list(sort, limit) {
          if (useBackend()) return backend.reservations.my();
          return generic.list(sort, limit);
        },
        async filter(filters = {}, sort, limit) {
          if (useBackend()) {
            const list = await backend.reservations.my(filters.status);
            if (filters.box_id) return list.filter((r) => (r.boxId || r.box_id) === filters.box_id);
            if (filters.date) return list.filter((r) => r.date === filters.date);
            return list;
          }
          return generic.filter(filters, sort, limit);
        },
        async create(data) {
          if (useBackend()) {
            return backend.reservations.create({
              box_id: data.box_id,
              boxId: data.boxId,
              date: data.date,
              start_time: data.start_time,
              startTime: data.startTime,
              end_time: data.end_time,
              endTime: data.endTime,
              type: data.type || 'Solo',
              personal_id: data.personal_id,
              personalId: data.personalId,
            });
          }
          return generic.create(data);
        },
        async update(id, data) {
          if (useBackend() && data && (data.status === 'cancelled' || data.status === 'canceled')) {
            return backend.reservations.cancel(id);
          }
          return generic.update(id, data);
        },
        async delete(id) {
          return generic.delete(id);
        },
      };
    })(),
    User: createEntity('User'),
    Personal: (() => {
      const generic = createEntity('Personal');
      return {
        async list(sort, limit) {
          if (useBackend()) return backend.personals.list({});
          return generic.list(sort, limit);
        },
        async filter(filters = {}, sort, limit) {
          if (useBackend()) {
            if (filters.id) {
              const p = await backend.personals.get(filters.id);
              return p ? [p] : [];
            }
            return backend.personals.list({ level: filters.level, approved: filters.approved ?? (filters.status === 'active' ? true : undefined) });
          }
          return generic.filter(filters, sort, limit);
        },
        async create(data) {
          if (useBackend()) return backend.personals.create(data);
          return generic.create(data);
        },
        async update(id, data) {
          if (useBackend()) return backend.personals.update(id, data);
          return generic.update(id, data);
        },
        async delete(id) {
          return generic.delete(id);
        },
      };
    })(),
    PlantaoShift: createEntity('PlantaoShift'),
    PersonalReview: createEntity('PersonalReview'),
    SupportTicket: (() => {
      const generic = createEntity('SupportTicket');
      return {
        async list(sort, limit) {
          if (useBackend()) return backend.supportTickets.my();
          return generic.list(sort, limit);
        },
        async filter(filters = {}, sort, limit) {
          if (useBackend()) return backend.supportTickets.my();
          return generic.filter(filters, sort, limit);
        },
        async adminList(filters = {}, sort, limit) {
          if (useBackend()) {
            return backend.supportTickets.adminList({
              status: filters.status,
              category: filters.category,
              sort: sort || '-created_date',
              limit: limit ?? 200,
            });
          }
          return generic.filter(filters, sort, limit);
        },
        async adminUpdate(id, data) {
          if (useBackend()) return backend.supportTickets.adminUpdate(id, data);
          return generic.update(id, data);
        },
        async create(data) {
          if (useBackend()) {
            return backend.supportTickets.create({
              subject: data.subject,
              message: data.message,
              category: data.category || 'general',
            });
          }
          return generic.create(data);
        },
        async update(id, data) {
          return generic.update(id, data);
        },
        async delete(id) {
          return generic.delete(id);
        },
      };
    })(),
  },
  backend,
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const base = getBaseUrl();
        const token = await getToken();
        const formData = new FormData();
        const fileName = file.fileName || 'image.jpg';
        const mimeType = file.mimeType || 'image/jpeg';

        // On web, FormData must receive a Blob/File; data: or blob: URIs need to be fetched first
        if (typeof window !== 'undefined' && file.uri && (file.uri.startsWith('data:') || file.uri.startsWith('blob:'))) {
          const blobRes = await fetch(file.uri);
          const blob = await blobRes.blob();
          formData.append('file', new File([blob], fileName, { type: mimeType }));
        } else {
          formData.append('file', {
            uri: file.uri,
            type: mimeType,
            name: fileName,
          });
        }

        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        if (appParams.appId) headers['X-App-Id'] = appParams.appId;
        const res = await fetch(`${base}/upload`, { method: 'POST', body: formData, headers });
        if (!res.ok) {
          const errText = await res.text();
          let errData;
          try {
            errData = JSON.parse(errText);
          } catch {
            errData = { message: errText || 'Upload failed' };
          }
          const e = new Error(errData.message || 'Upload failed');
          e.status = res.status;
          e.data = errData;
          throw e;
        }
        const data = await res.json();
        return { file_url: data.file_url || data.url || file.uri };
      },
    },
  },
  async getPublicSettings(appId) {
    const base = getBaseUrl();
    const token = await getToken();
    const url = `${base}/apps/public/public-settings/by-id/${encodeURIComponent(appId || appParams.appId)}`;
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(appParams.appId ? { 'X-App-Id': appParams.appId } : {}) };
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = new Error(res.statusText || 'Request failed');
      err.status = res.status;
      try {
        err.data = await res.json();
      } catch {
        err.data = { message: await res.text() };
      }
      throw err;
    }
    return res.json();
  },
};

export default api;
