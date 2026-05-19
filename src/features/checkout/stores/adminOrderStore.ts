import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiService from '@shared/api/api-service';
import type { Order } from '@shared/types/order';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { withLoading } from '@shared/utils/asyncUtils';

interface DailyStat {
  date: string;
  count: number;
  amount: number;
  amountTTC: number;
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);
  const activeCartsCount = ref(0);
  const loading = ref(false);
  const periodFilter = ref<'all' | 'month' | 'week' | 'today'>('all');

  const filteredOrders = computed(() => {
    if (periodFilter.value === 'all') return orders.value;
    
    const now = new Date();
    const threshold = new Date();
    
    if (periodFilter.value === 'today') {
      threshold.setHours(0, 0, 0, 0);
    } else if (periodFilter.value === 'week') {
      threshold.setDate(now.getDate() - 7);
    } else if (periodFilter.value === 'month') {
      threshold.setMonth(now.getMonth() - 1);
    }

    return orders.value.filter(order => {
      const dateRaw = (order as any).date_add || order.date;
      if (!dateRaw) return false;
      return new Date(dateRaw) >= threshold;
    });
  });

  const fetchOrders = async () => {
    await withLoading(loading, async () => {
      const [orderRes, cartRes, allOrderCartsRes] = await Promise.all([
        apiService.get<any>('/orders?filter[current_state]=![6]&display=full'),
        apiService.get<any>('/carts?display=[id]&filter[id_customer]=![0]'),
        apiService.get<any>('/orders?display=[id_cart]')
      ]);
      
      orders.value = ensureArray(orderRes?.prestashop?.orders?.order);
      
      const cartsList = ensureArray(cartRes?.prestashop?.carts?.cart);
      
      // On soustrait les carts qui sont déjà des commandes (incluant les commandes annulées)
      const allOrdersList = ensureArray(allOrderCartsRes?.prestashop?.orders?.order);
      const usedCartIds = new Set(allOrdersList.map(o => extractIdValue((o as any).id_cart)));
      
      activeCartsCount.value = cartsList.filter(c => {
        const cid = extractIdValue(c.id);
        return !usedCartIds.has(cid);
      }).length;
    });
  };

  const totalOrders = computed(() => filteredOrders.value.length);
  const totalAmount = computed(() => {
    return filteredOrders.value.reduce((sum, order) => sum + (Number((order as any).total_paid_tax_excl || (order as any).total_paid || order.total_price) || 0), 0);
  });
  const totalAmountTTC = computed(() => {
    return filteredOrders.value.reduce((sum, order) => sum + (Number((order as any).total_paid || order.total_price) || 0), 0);
  });

  const dailyStats = computed<DailyStat[]>(() => {
    const statsMap = new Map<string, DailyStat>();

    filteredOrders.value.forEach(order => {
      // Depending on the order date format (e.g. YYYY-MM-DD)
      const rawDate = (order as any).date_add || order.date;
      const dateKey = rawDate ? String(rawDate).split(' ')[0] : 'Inconnu';

      if (!statsMap.has(dateKey)) {
        statsMap.set(dateKey, { date: dateKey, count: 0, amount: 0, amountTTC: 0 });
      }

      const stat = statsMap.get(dateKey)!;
      stat.count += 1;
      stat.amount += Number((order as any).total_paid_tax_excl || (order as any).total_paid || order.total_price) || 0;
      stat.amountTTC += Number((order as any).total_paid || order.total_price) || 0;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  });

  return {
    orders,
    activeCartsCount,
    loading,
    periodFilter,
    filteredOrders,
    fetchOrders,
    totalOrders,
    totalAmount,
    totalAmountTTC,
    dailyStats
  };
});
