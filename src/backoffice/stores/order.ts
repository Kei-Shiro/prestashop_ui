import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiService from '@shared/services/api-service';
import type { Order } from '@shared/types/order';

interface DailyStat {
  date: string;
  count: number;
  amount: number;
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);
  const activeCartsCount = ref(0);
  const loading = ref(false);

  const fetchOrders = async () => {
    loading.value = true;
    try {
      const [orderRes, cartRes] = await Promise.all([
        apiService.get<any>('/orders?display=full'),
        apiService.get<any>('/carts?display=[id]&filter[id_customer]=![0]')
      ]);
      
      const pOrders = orderRes?.prestashop?.orders?.order;
      if (pOrders) {
        orders.value = Array.isArray(pOrders) ? pOrders : [pOrders];
      } else {
        orders.value = [];
      }
      
      const pCarts = cartRes?.prestashop?.carts?.cart;
      const cartsList = Array.isArray(pCarts) ? pCarts : (pCarts ? [pCarts] : []);
      // On soustrait les carts qui sont déjà des commandes
      const usedCartIds = new Set(orders.value.map(o => String((o as any).id_cart)));
      activeCartsCount.value = cartsList.filter(c => !usedCartIds.has(String(c.id))).length;
      
    } catch (error) {
      console.error('Failed to fetch orders/carts', error);
      orders.value = [];
    } finally {
      loading.value = false;
    }
  };

  const totalOrders = computed(() => orders.value.length);
  const totalAmount = computed(() => {
    return orders.value.reduce((sum, order) => sum + (Number((order as any).total_paid || order.total_price) || 0), 0);
  });

  const dailyStats = computed<DailyStat[]>(() => {
    const statsMap = new Map<string, DailyStat>();

    orders.value.forEach(order => {
      // Depending on the order date format (e.g. YYYY-MM-DD)
      const rawDate = (order as any).date_add || order.date;
      const dateKey = rawDate ? String(rawDate).split(' ')[0] : 'Inconnu';

      if (!statsMap.has(dateKey)) {
        statsMap.set(dateKey, { date: dateKey, count: 0, amount: 0 });
      }

      const stat = statsMap.get(dateKey)!;
      stat.count += 1;
      stat.amount += Number((order as any).total_paid || order.total_price) || 0;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  });

  return {
    orders,
    loading,
    fetchOrders,
    totalOrders,
    totalAmount,
    dailyStats
  };
});
