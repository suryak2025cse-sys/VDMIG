import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { initialDemoData } from './mockData';

const STORAGE_KEY = 'vdmig_village_data_v2';

// Clear any old legacy cache keys from previous demo runs
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (localStorage.getItem('vdmig_village_data_v1')) {
      localStorage.removeItem('vdmig_village_data_v1');
    }
  }
} catch (e) {
  // Ignore storage access error
}

// Initialize local storage repository if needed
function getLocalData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDemoData));
    return initialDemoData;
  }
  try {
    const parsed = JSON.parse(saved);
    // Ensure critical arrays exist
    if (!parsed.profiles) parsed.profiles = [];
    if (!parsed.payments) parsed.payments = [];
    if (!parsed.collectors) parsed.collectors = [];
    return parsed;
  } catch (e) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDemoData));
    return initialDemoData;
  }
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const dataService = {
  // -------------------------------------------------------------
  // SYSTEM SETTINGS
  // -------------------------------------------------------------
  async getSettings() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.settings;
  },

  async updateSettings(settingsData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({ id: 'primary', ...settingsData, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    local.settings = { ...local.settings, ...settingsData, updated_at: new Date().toISOString() };
    saveLocalData(local);
    return local.settings;
  },

  // -------------------------------------------------------------
  // PAYMENT COLLECTORS
  // -------------------------------------------------------------
  async getCollectors() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('payment_collectors').select('*').order('slot_number', { ascending: true });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.collectors || [];
  },

  async updateCollector(slotNumber, collectorData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payment_collectors')
        .update({ ...collectorData, updated_at: new Date().toISOString() })
        .eq('slot_number', slotNumber)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.collectors.findIndex(c => c.slot_number === slotNumber);
    if (index !== -1) {
      local.collectors[index] = { ...local.collectors[index], ...collectorData, updated_at: new Date().toISOString() };
    } else {
      local.collectors.push({ id: `c${slotNumber}-uuid`, slot_number: slotNumber, ...collectorData, updated_at: new Date().toISOString() });
    }
    saveLocalData(local);
    return local.collectors.find(c => c.slot_number === slotNumber);
  },

  // -------------------------------------------------------------
  // PROFILES / MEMBERS
  // -------------------------------------------------------------
  async getProfiles() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.profiles || [];
  },

  async getProfileById(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.profiles.find(p => p.id === userId) || null;
  },

  async createProfile(profileData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').insert(profileData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newProfile = {
      id: profileData.id || `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...profileData,
    };
    local.profiles = [newProfile, ...(local.profiles || [])];
    saveLocalData(local);
    return newProfile;
  },

  async updateProfileStatus(userId, status, rejectionReason = '') {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status, rejection_reason: rejectionReason, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.profiles.findIndex(p => p.id === userId);
    if (index !== -1) {
      local.profiles[index].status = status;
      local.profiles[index].rejection_reason = rejectionReason;
      local.profiles[index].updated_at = new Date().toISOString();
      saveLocalData(local);
      return local.profiles[index];
    }
    throw new Error('User not found');
  },

  async updateProfileRole(userId, role) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.profiles.findIndex(p => p.id === userId);
    if (index !== -1) {
      local.profiles[index].role = role;
      local.profiles[index].updated_at = new Date().toISOString();
      saveLocalData(local);
      return local.profiles[index];
    }
    throw new Error('User not found');
  },

  async updateProfileInfo(userId, updateFields) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updateFields, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.profiles.findIndex(p => p.id === userId);
    if (index !== -1) {
      local.profiles[index] = { ...local.profiles[index], ...updateFields, updated_at: new Date().toISOString() };
      saveLocalData(local);
      return local.profiles[index];
    }
    throw new Error('User not found');
  },

  // -------------------------------------------------------------
  // PAYMENTS
  // -------------------------------------------------------------
  async getPayments(filter = {}) {
    if (isSupabaseConfigured) {
      let query = supabase.from('payments').select('*, profiles:member_id (name, phone, email)').order('created_at', { ascending: false });
      if (filter.member_id) query = query.eq('member_id', filter.member_id);
      if (filter.status) query = query.eq('status', filter.status);
      if (filter.collector_id) query = query.eq('collector_id', filter.collector_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    let res = [...(local.payments || [])];
    if (filter.member_id) res = res.filter(p => p.member_id === filter.member_id);
    if (filter.status && filter.status !== 'all') res = res.filter(p => p.status === filter.status);
    if (filter.collector_id && filter.collector_id !== 'all') res = res.filter(p => p.collector_id === filter.collector_id);
    return res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async submitPayment(paymentData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('payments').insert(paymentData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newPayment = {
      id: `pay-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      verified_by: null,
      verified_by_name: null,
      verified_at: null,
      rejection_note: null,
      ...paymentData,
    };
    local.payments = [newPayment, ...(local.payments || [])];
    saveLocalData(local);
    return newPayment;
  },

  async verifyPayment(paymentId, verifierId, verifierName) {
    const verifiedAt = new Date().toISOString();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          verified_by: verifierId,
          verified_at: verifiedAt,
          updated_at: verifiedAt,
        })
        .eq('id', paymentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.payments.findIndex(p => p.id === paymentId);
    if (index !== -1) {
      local.payments[index].status = 'verified';
      local.payments[index].verified_by = verifierId;
      local.payments[index].verified_by_name = verifierName;
      local.payments[index].verified_at = verifiedAt;
      local.payments[index].updated_at = verifiedAt;
      saveLocalData(local);
      return local.payments[index];
    }
    throw new Error('Payment record not found');
  },

  async rejectPayment(paymentId, verifierId, verifierName, rejectionNote = '') {
    const verifiedAt = new Date().toISOString();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          verified_by: verifierId,
          verified_at: verifiedAt,
          rejection_note: rejectionNote,
          updated_at: verifiedAt,
        })
        .eq('id', paymentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.payments.findIndex(p => p.id === paymentId);
    if (index !== -1) {
      local.payments[index].status = 'rejected';
      local.payments[index].verified_by = verifierId;
      local.payments[index].verified_by_name = verifierName;
      local.payments[index].verified_at = verifiedAt;
      local.payments[index].rejection_note = rejectionNote;
      local.payments[index].updated_at = verifiedAt;
      saveLocalData(local);
      return local.payments[index];
    }
    throw new Error('Payment record not found');
  },

  async deletePayment(paymentId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.payments = (local.payments || []).filter(p => p.id !== paymentId);
    saveLocalData(local);
    return true;
  },

  async deleteAllPayments() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.payments = [];
    saveLocalData(local);
    return true;
  },

  async deleteProfile(userId) {
    if (isSupabaseConfigured) {
      // Remove related records first
      await supabase.from('payments').delete().eq('member_id', userId);
      await supabase.from('attendance_records').delete().eq('member_id', userId);
      await supabase.from('notifications').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.profiles = (local.profiles || []).filter(p => p.id !== userId);
    local.payments = (local.payments || []).filter(p => p.member_id !== userId);
    saveLocalData(local);
    return true;
  },

  async deleteAllProfiles() {
    if (isSupabaseConfigured) {
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.profiles = [];
    local.payments = [];
    saveLocalData(local);
    return true;
  },

  async deleteAllCollectors() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('payment_collectors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.collectors = [];
    saveLocalData(local);
    return true;
  },

  async resetMembersAndPayments() {
    if (isSupabaseConfigured) {
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('payment_collectors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return true;
    }
    const local = getLocalData();
    local.profiles = [];
    local.payments = [];
    local.collectors = [];
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // DANCE PERFORMANCES
  // -------------------------------------------------------------
  async getDances() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('dance_performances').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.dances || [];
  },

  async createDance(danceData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('dance_performances').insert(danceData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newDance = {
      id: `dance-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      ...danceData,
    };
    local.dances = [newDance, ...(local.dances || [])];
    saveLocalData(local);
    return newDance;
  },

  async updateDance(danceId, danceData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('dance_performances')
        .update({ ...danceData, updated_at: new Date().toISOString() })
        .eq('id', danceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.dances.findIndex(d => d.id === danceId);
    if (index !== -1) {
      local.dances[index] = { ...local.dances[index], ...danceData, updated_at: new Date().toISOString() };
      saveLocalData(local);
      return local.dances[index];
    }
    throw new Error('Dance performance not found');
  },

  async deleteDance(danceId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('dance_performances').delete().eq('id', danceId);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.dances = local.dances.filter(d => d.id !== danceId);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // INCOME
  // -------------------------------------------------------------
  async getIncome() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('income').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.income || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createIncome(incomeData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('income').insert(incomeData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newIncome = {
      id: `inc-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...incomeData,
      amount: Number(incomeData.amount),
    };
    local.income = [newIncome, ...(local.income || [])];
    saveLocalData(local);
    return newIncome;
  },

  async updateIncome(id, incomeData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('income')
        .update({ ...incomeData, amount: Number(incomeData.amount), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.income.findIndex(i => i.id === id);
    if (index !== -1) {
      local.income[index] = { ...local.income[index], ...incomeData, amount: Number(incomeData.amount), updated_at: new Date().toISOString() };
      saveLocalData(local);
      return local.income[index];
    }
    throw new Error('Income record not found');
  },

  async deleteIncome(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('income').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.income = local.income.filter(i => i.id !== id);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // EXPENSES
  // -------------------------------------------------------------
  async getExpenses() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.expenses || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createExpense(expenseData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('expenses').insert(expenseData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newExpense = {
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...expenseData,
      amount: Number(expenseData.amount),
    };
    local.expenses = [newExpense, ...(local.expenses || [])];
    saveLocalData(local);
    return newExpense;
  },

  async updateExpense(id, expenseData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .update({ ...expenseData, amount: Number(expenseData.amount), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      local.expenses[index] = { ...local.expenses[index], ...expenseData, amount: Number(expenseData.amount), updated_at: new Date().toISOString() };
      saveLocalData(local);
      return local.expenses[index];
    }
    throw new Error('Expense record not found');
  },

  async deleteExpense(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.expenses = local.expenses.filter(e => e.id !== id);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------
  async getEvents() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.events || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async createEvent(eventData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('events').insert(eventData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newEvent = {
      id: `evt-${Date.now()}`,
      status: 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...eventData,
    };
    local.events = [newEvent, ...(local.events || [])];
    saveLocalData(local);
    return newEvent;
  },

  async updateEvent(id, eventData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const index = local.events.findIndex(e => e.id === id);
    if (index !== -1) {
      local.events[index] = { ...local.events[index], ...eventData, updated_at: new Date().toISOString() };
      saveLocalData(local);
      return local.events[index];
    }
    throw new Error('Event not found');
  },

  async deleteEvent(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.events = local.events.filter(e => e.id !== id);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // ANNOUNCEMENTS
  // -------------------------------------------------------------
  async getAnnouncements() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.announcements || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createAnnouncement(announcementData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('announcements').insert(announcementData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newAnn = {
      id: `ann-${Date.now()}`,
      created_at: new Date().toISOString(),
      priority: 'normal',
      ...announcementData,
    };
    local.announcements = [newAnn, ...(local.announcements || [])];
    saveLocalData(local);
    return newAnn;
  },

  async deleteAnnouncement(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.announcements = local.announcements.filter(a => a.id !== id);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // ATTENDANCE
  // -------------------------------------------------------------
  async getAttendanceSessions() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, attendance_records(*, profiles(name, phone))')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.attendance_sessions || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createAttendanceSession(sessionData, records = []) {
    if (isSupabaseConfigured) {
      const { data: session, error } = await supabase
        .from('attendance_sessions')
        .insert(sessionData)
        .select()
        .single();
      if (error) throw error;

      if (records.length > 0) {
        const rows = records.map(r => ({
          session_id: session.id,
          member_id: r.member_id,
          status: r.status,
        }));
        await supabase.from('attendance_records').insert(rows);
      }
      return session;
    }
    const local = getLocalData();
    const newSession = {
      id: `att-${Date.now()}`,
      created_at: new Date().toISOString(),
      records,
      ...sessionData,
    };
    local.attendance_sessions = [newSession, ...(local.attendance_sessions || [])];
    saveLocalData(local);
    return newSession;
  },

  async updateAttendanceRecords(sessionId, records) {
    if (isSupabaseConfigured) {
      await supabase.from('attendance_records').delete().eq('session_id', sessionId);
      const rows = records.map(r => ({
        session_id: sessionId,
        member_id: r.member_id,
        status: r.status,
      }));
      const { error } = await supabase.from('attendance_records').insert(rows);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    const index = local.attendance_sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      local.attendance_sessions[index].records = records;
      saveLocalData(local);
      return true;
    }
    throw new Error('Session not found');
  },

  // -------------------------------------------------------------
  // GALLERY
  // -------------------------------------------------------------
  async getGallery() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return local.gallery || [];
  },

  async addGalleryImage(imageData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('gallery').insert(imageData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newImg = {
      id: `gal-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...imageData,
    };
    local.gallery = [newImg, ...(local.gallery || [])];
    saveLocalData(local);
    return newImg;
  },

  async deleteGalleryImage(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.gallery = local.gallery.filter(g => g.id !== id);
    saveLocalData(local);
    return true;
  },

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  async getNotifications(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    return (local.notifications || []).filter(n => n.user_id === userId || !n.user_id);
  },

  async markNotificationAsRead(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    const index = local.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      local.notifications[index].is_read = true;
      saveLocalData(local);
    }
    return true;
  },

  async markAllNotificationsAsRead(userId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
      if (error) throw error;
      return true;
    }
    const local = getLocalData();
    local.notifications = (local.notifications || []).map(n => {
      if (n.user_id === userId || !n.user_id) return { ...n, is_read: true };
      return n;
    });
    saveLocalData(local);
    return true;
  },

  async createNotification(notifData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('notifications').insert(notifData).select().single();
      if (error) throw error;
      return data;
    }
    const local = getLocalData();
    const newNotif = {
      id: `notif-${Date.now()}`,
      is_read: false,
      created_at: new Date().toISOString(),
      ...notifData,
    };
    local.notifications = [newNotif, ...(local.notifications || [])];
    saveLocalData(local);
    return newNotif;
  },

  // -------------------------------------------------------------
  // FILE STORAGE HELPER
  // -------------------------------------------------------------
  async uploadFile(bucket, file, customName) {
    if (isSupabaseConfigured) {
      const ext = file.name.split('.').pop();
      const fileName = `${customName || Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    }
    // In local demo mode, create a local blob object URL or Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  },
};
