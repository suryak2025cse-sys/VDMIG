import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { initialDemoData } from './mockData';
import { cloudinaryUpload, cloudinaryDelete } from './cloudinaryService';

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
    if (!parsed.albums) parsed.albums = [];
    if (!parsed.gallery) parsed.gallery = [];
    if (!parsed.user_blocks) parsed.user_blocks = [];
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
      const { data, error } = await supabase.from('system_settings').select('*').maybeSingle();
      if (error) throw error;
      return data || {
        id: 'primary',
        group_name_ta: 'வதம்பை இளந்தளிர் குழு',
        group_name_en: 'Vadambai Ilanthazhir Kuzhu',
        contact_phone: '',
      };
    }
    const local = getLocalData();
    return local.settings;
  },

  async updateSettings(settingsData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert(
          { id: 'primary', ...settingsData, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        )
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
      return data || [];
    }
    const local = getLocalData();
    return local.collectors || [];
  },

  async updateCollector(slotNumber, collectorData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payment_collectors')
        .upsert(
          { slot_number: slotNumber, ...collectorData, updated_at: new Date().toISOString() },
          { onConflict: 'slot_number' }
        )
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
      return data || [];
    }
    const local = getLocalData();
    return local.profiles || [];
  },

  async getProfileById(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
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

  async updateProfileStatus(userId, status, rejectionReason = '', blockerId = null) {
    if (isSupabaseConfigured) {
      // 1. Try updating with block tracking columns
      const updatePayload = {
        status,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      };
      if (status === 'blocked') {
        if (blockerId) updatePayload.blocked_by = blockerId;
        updatePayload.blocked_at = new Date().toISOString();
      } else if (status === 'approved') {
        updatePayload.blocked_by = null;
        updatePayload.blocked_at = null;
        updatePayload.rejection_reason = null;
      }

      let data, error;
      try {
        const res = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select();
        data = res.data;
        error = res.error;
      } catch (e) {
        error = e;
      }

      // Fallback if blocked_by column doesn't exist yet in Supabase
      if (error && (error.message?.includes('blocked_by') || error.message?.includes('column'))) {
        const fallbackRes = await supabase
          .from('profiles')
          .update({ status, rejection_reason: rejectionReason, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select();
        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data;
      } else if (error) {
        throw error;
      }

      // Also sync user_blocks table if appropriate
      if (status === 'blocked' && blockerId) {
        try {
          await supabase.from('user_blocks').upsert({
            blocker_id: blockerId,
            blocked_id: userId,
            reason: rejectionReason || 'Blocked by admin/leader',
          }, { onConflict: 'blocker_id,blocked_id' });
        } catch (e) {
          console.warn('user_blocks upsert warning:', e.message);
        }
      } else if (status === 'approved') {
        try {
          await supabase.from('user_blocks').delete().eq('blocked_id', userId);
        } catch (e) {
          console.warn('user_blocks delete warning:', e.message);
        }
      }

      return data && data.length > 0 ? data[0] : null;
    }

    const local = getLocalData();
    const index = local.profiles.findIndex(p => p.id === userId);
    if (index !== -1) {
      local.profiles[index].status = status;
      local.profiles[index].rejection_reason = rejectionReason;
      local.profiles[index].updated_at = new Date().toISOString();
      if (status === 'blocked') {
        local.profiles[index].blocked_by = blockerId;
        local.profiles[index].blocked_at = new Date().toISOString();
        if (blockerId) {
          if (!local.user_blocks) local.user_blocks = [];
          if (!local.user_blocks.some(b => b.blocked_id === userId && b.blocker_id === blockerId)) {
            local.user_blocks.push({
              id: `blk-${Date.now()}`,
              blocker_id: blockerId,
              blocked_id: userId,
              reason: rejectionReason,
              created_at: new Date().toISOString(),
            });
          }
        }
      } else if (status === 'approved') {
        local.profiles[index].blocked_by = null;
        local.profiles[index].blocked_at = null;
        local.profiles[index].rejection_reason = null;
        if (local.user_blocks) {
          local.user_blocks = local.user_blocks.filter(b => b.blocked_id !== userId);
        }
      }
      saveLocalData(local);
      return local.profiles[index];
    }
    throw new Error('User not found');
  },

  async blockUser(targetUserId, blockerId, reason = '') {
    return await this.updateProfileStatus(targetUserId, 'blocked', reason, blockerId);
  },

  async unblockUser(targetUserId, blockerId = null) {
    return await this.updateProfileStatus(targetUserId, 'approved', '', blockerId);
  },

  async getBlockedUsers(currentUserId = null, isLeaderOrAdmin = false) {
    if (isSupabaseConfigured) {
      try {
        // Query profiles with status 'blocked'
        let query = supabase.from('profiles').select('*').eq('status', 'blocked');
        if (!isLeaderOrAdmin && currentUserId) {
          query = query.eq('blocked_by', currentUserId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Failed to query blocked profiles:', err);
      }
      // Try from user_blocks if blocked_by was not populated
      try {
        let ubQuery = supabase.from('user_blocks').select('*, profiles!user_blocks_blocked_id_fkey(*)');
        if (!isLeaderOrAdmin && currentUserId) {
          ubQuery = ubQuery.eq('blocker_id', currentUserId);
        }
        const { data: ubData } = await ubQuery;
        if (ubData && ubData.length > 0) {
          return ubData.map(ub => ({
            ...ub.profiles,
            blocked_by: ub.blocker_id,
            blocked_at: ub.created_at,
          })).filter(Boolean);
        }
      } catch (e) {
        // Fall through
      }
      return [];
    }

    const local = getLocalData();
    const blockedProfiles = (local.profiles || []).filter(p => {
      if (p.status !== 'blocked') return false;
      if (isLeaderOrAdmin) return true;
      return !currentUserId || p.blocked_by === currentUserId;
    });
    return blockedProfiles;
  },

  async updateProfileRole(userId, role) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
      const { data, error } = await supabase.from('payments').insert(paymentData).select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
        .select();
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
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
      const { data: record } = await supabase.from('dance_performances').select('song_url').eq('id', danceId).maybeSingle();
      const { error } = await supabase.from('dance_performances').delete().eq('id', danceId);
      if (error) throw error;
      if (record?.song_url) {
        await cloudinaryDelete(record.song_url, 'video').catch(() => {});
      }
      return true;
    }
    const local = getLocalData();
    const item = (local.dances || []).find(d => d.id === danceId);
    if (item?.song_url) {
      await cloudinaryDelete(item.song_url, 'video').catch(() => {});
    }
    local.dances = (local.dances || []).filter(d => d.id !== danceId);
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
      return (data || []).map(item => {
        if (!item.paid_by && item.notes && item.notes.includes('Paid by:')) {
          const match = item.notes.match(/(?:\(?Paid by:\s*([^)]+)\)?)/i);
          if (match && match[1]) {
            return { ...item, paid_by: match[1].trim() };
          }
        }
        return item;
      });
    }
    const local = getLocalData();
    return (local.income || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createIncome(incomeData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('income').insert(incomeData).select().single();
      if (error) {
        // If paid_by column does not exist yet in Supabase schema cache, fallback gracefully
        if (error.message && (error.message.includes('paid_by') || error.message.includes('schema cache'))) {
          const fallbackData = { ...incomeData };
          const payer = fallbackData.paid_by;
          delete fallbackData.paid_by;
          if (payer) {
            fallbackData.notes = fallbackData.notes 
              ? `${fallbackData.notes} (Paid by: ${payer})`
              : `Paid by: ${payer}`;
          }
          const { data: retryData, error: retryError } = await supabase.from('income').insert(fallbackData).select().single();
          if (retryError) throw retryError;
          return retryData ? { ...retryData, paid_by: payer } : retryData;
        }
        throw error;
      }
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
      if (error) {
        // If paid_by column does not exist yet in Supabase schema cache, fallback gracefully
        if (error.message && (error.message.includes('paid_by') || error.message.includes('schema cache'))) {
          const fallbackData = { ...incomeData, amount: Number(incomeData.amount), updated_at: new Date().toISOString() };
          const payer = fallbackData.paid_by;
          delete fallbackData.paid_by;
          if (payer) {
            fallbackData.notes = fallbackData.notes 
              ? `${fallbackData.notes} (Paid by: ${payer})`
              : `Paid by: ${payer}`;
          }
          const { data: retryData, error: retryError } = await supabase
            .from('income')
            .update(fallbackData)
            .eq('id', id)
            .select()
            .single();
          if (retryError) throw retryError;
          return retryData ? { ...retryData, paid_by: payer } : retryData;
        }
        throw error;
      }
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
  // ALBUMS & GALLERY
  // -------------------------------------------------------------
  async getAlbums() {
    if (isSupabaseConfigured) {
      try {
        const { data: albumsData, error: albumsError } = await supabase
          .from('albums')
          .select('*')
          .order('created_at', { ascending: false });

        if (!albumsError && albumsData) {
          const { data: mediaItems } = await supabase
            .from('gallery')
            .select('id, album_id, event_name, media_type, file_url, image_url');
          const media = mediaItems || [];

          return albumsData.map(alb => {
            const albumMedia = media.filter(
              m => m.album_id === alb.id || (m.event_name && m.event_name.trim().toLowerCase() === alb.name.trim().toLowerCase())
            );
            const imageCount = albumMedia.filter(m => m.media_type !== 'video').length;
            const videoCount = albumMedia.filter(m => m.media_type === 'video').length;
            const firstImg = albumMedia.find(m => m.media_type !== 'video');
            return {
              ...alb,
              media_count: albumMedia.length,
              image_count: imageCount,
              video_count: videoCount,
              cover_image_url: alb.cover_image_url || firstImg?.file_url || firstImg?.image_url || null,
            };
          });
        }
      } catch (err) {
        console.warn('Albums table query error, falling back to gallery event grouping:', err);
      }

      // Fallback: derive albums from gallery event_name if albums table does not exist
      const { data: galleryItems } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      const items = galleryItems || [];
      const distinctNames = Array.from(new Set(items.map(i => i.event_name || 'General').filter(Boolean)));
      return distinctNames.map(name => {
        const matching = items.filter(i => (i.event_name || 'General') === name);
        const firstImg = matching.find(m => m.media_type !== 'video' || m.image_url);
        return {
          id: name,
          name,
          description: '',
          cover_image_url: firstImg?.image_url || firstImg?.file_url || '',
          media_count: matching.length,
          image_count: matching.filter(m => m.media_type !== 'video').length,
          video_count: matching.filter(m => m.media_type === 'video').length,
          created_at: matching[0]?.created_at || new Date().toISOString(),
        };
      });
    }

    const local = getLocalData();
    if (!local.albums) local.albums = [];
    const media = local.gallery || [];

    // If local.albums is empty but local.gallery has items, create default albums
    if (local.albums.length === 0 && media.length > 0) {
      const distinct = Array.from(new Set(media.map(m => m.event_name || 'General').filter(Boolean)));
      local.albums = distinct.map(name => ({
        id: `alb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        description: '',
        cover_image_url: media.find(m => (m.event_name || 'General') === name)?.image_url || '',
        created_at: new Date().toISOString(),
      }));
      saveLocalData(local);
    }

    return (local.albums || []).map(alb => {
      const albumMedia = media.filter(
        m => m.album_id === alb.id || (m.event_name && m.event_name.trim().toLowerCase() === alb.name.trim().toLowerCase())
      );
      const imageCount = albumMedia.filter(m => m.media_type !== 'video').length;
      const videoCount = albumMedia.filter(m => m.media_type === 'video').length;
      const firstImg = albumMedia.find(m => m.media_type !== 'video');
      return {
        ...alb,
        media_count: albumMedia.length,
        image_count: imageCount,
        video_count: videoCount,
        cover_image_url: alb.cover_image_url || firstImg?.file_url || firstImg?.image_url || null,
      };
    });
  },

  async createAlbum(albumData) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('albums').insert(albumData).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createAlbum error, using local fallback:', err);
      }
    }
    const local = getLocalData();
    if (!local.albums) local.albums = [];
    const newAlbum = {
      id: `alb-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media_count: 0,
      image_count: 0,
      video_count: 0,
      ...albumData,
    };
    local.albums = [newAlbum, ...local.albums];
    saveLocalData(local);
    return newAlbum;
  },

  async updateAlbum(id, updateFields) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('albums')
          .update({ ...updateFields, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateAlbum error:', err);
      }
    }
    const local = getLocalData();
    const idx = (local.albums || []).findIndex(a => a.id === id);
    if (idx !== -1) {
      local.albums[idx] = {
        ...local.albums[idx],
        ...updateFields,
        updated_at: new Date().toISOString(),
      };
      saveLocalData(local);
      return local.albums[idx];
    }
    return null;
  },

  async deleteAlbum(id, albumName = '') {
    // 1. Get and delete all media in this album
    const mediaList = await this.getAlbumMedia(id, albumName);
    for (const item of mediaList) {
      await this.deleteAlbumMedia(item.id);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('albums').delete().eq('id', id);
        return true;
      } catch (err) {
        console.warn('Supabase deleteAlbum error:', err);
      }
    }
    const local = getLocalData();
    local.albums = (local.albums || []).filter(a => a.id !== id && a.name !== albumName);
    saveLocalData(local);
    return true;
  },

  async getAlbumMedia(albumId, albumName = '') {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('gallery').select('*');
        if (albumId && albumId.length === 36) {
          query = query.or(`album_id.eq.${albumId},event_name.eq.${albumName || albumId}`);
        } else if (albumName) {
          query = query.eq('event_name', albumName);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          return data.map(m => ({
            ...m,
            file_url: m.file_url || m.image_url,
            media_type: m.media_type || (/\.(mp4|mov|webm|m4v)$/i.test(m.file_url || m.image_url || '') ? 'video' : 'image'),
          }));
        }
      } catch (err) {
        console.warn('Supabase getAlbumMedia error, falling back:', err);
      }
    }

    const local = getLocalData();
    const items = (local.gallery || []).filter(m =>
      m.album_id === albumId ||
      (albumName && m.event_name && m.event_name.trim().toLowerCase() === albumName.trim().toLowerCase())
    );
    return items.map(m => ({
      ...m,
      file_url: m.file_url || m.image_url,
      media_type: m.media_type || (/\.(mp4|mov|webm|m4v)$/i.test(m.file_url || m.image_url || '') ? 'video' : 'image'),
    }));
  },

  async addAlbumMedia(mediaData) {
    const payload = {
      ...mediaData,
      image_url: mediaData.file_url || mediaData.image_url,
      file_url: mediaData.file_url || mediaData.image_url,
      media_type: mediaData.media_type || (/\.(mp4|mov|webm|m4v)$/i.test(mediaData.file_url || '') ? 'video' : 'image'),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('gallery').insert(payload).select().single();
        if (!error && data) {
          if (payload.album_id && payload.media_type === 'image') {
            await supabase
              .from('albums')
              .update({ cover_image_url: payload.file_url })
              .eq('id', payload.album_id)
              .is('cover_image_url', null);
          }
          return {
            ...data,
            file_url: data.file_url || data.image_url,
            media_type: data.media_type || payload.media_type,
          };
        }
      } catch (err) {
        console.warn('Supabase addAlbumMedia error, using local fallback:', err);
      }
    }

    const local = getLocalData();
    const newMedia = {
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      ...payload,
    };
    local.gallery = [newMedia, ...(local.gallery || [])];

    if (payload.album_id && payload.media_type === 'image') {
      const albIdx = (local.albums || []).findIndex(a => a.id === payload.album_id);
      if (albIdx !== -1 && !local.albums[albIdx].cover_image_url) {
        local.albums[albIdx].cover_image_url = payload.file_url;
      }
    }
    saveLocalData(local);
    return newMedia;
  },

  async deleteAlbumMedia(id) {
    if (isSupabaseConfigured) {
      try {
        const { data: record } = await supabase
          .from('gallery')
          .select('id, file_url, image_url, media_type, public_id')
          .eq('id', id)
          .maybeSingle();

        const { error } = await supabase.from('gallery').delete().eq('id', id);
        if (error) throw error;

        const assetUrl = record?.public_id || record?.file_url || record?.image_url;
        const resType = record?.media_type === 'video' ? 'video' : 'image';
        if (assetUrl) {
          await cloudinaryDelete(assetUrl, resType).catch(() => {});
        }
        return true;
      } catch (err) {
        console.warn('Supabase deleteAlbumMedia error:', err);
      }
    }

    const local = getLocalData();
    const item = (local.gallery || []).find(g => g.id === id);
    if (item) {
      const assetUrl = item.public_id || item.file_url || item.image_url;
      const resType = item.media_type === 'video' ? 'video' : 'image';
      if (assetUrl) {
        await cloudinaryDelete(assetUrl, resType).catch(() => {});
      }
    }
    local.gallery = (local.gallery || []).filter(g => g.id !== id);
    saveLocalData(local);
    return true;
  },

  // Backwards compatibility for existing gallery calls
  async getGallery() {
    return await this.getAlbums();
  },

  async addGalleryImage(imageData) {
    return await this.addAlbumMedia(imageData);
  },

  async deleteGalleryImage(id) {
    return await this.deleteAlbumMedia(id);
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
      try {
        const { data, error } = await supabase.from('notifications').insert(notifData).select();
        if (error) {
          console.warn('Supabase notification insert warning:', error.message);
          return null;
        }
        return data && data.length > 0 ? data[0] : null;
      } catch (err) {
        console.warn('Notification creation skipped:', err.message);
        return null;
      }
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
  // CLOUDINARY MEDIA STORAGE HELPER
  // -------------------------------------------------------------
  async uploadFile(bucket, file, customName) {
    const result = await cloudinaryUpload({
      bucket,
      file,
      customName,
    });
    return result.url;
  },

  async deleteFile(publicIdOrUrl, resourceType = 'image') {
    return await cloudinaryDelete(publicIdOrUrl, resourceType);
  },
};
