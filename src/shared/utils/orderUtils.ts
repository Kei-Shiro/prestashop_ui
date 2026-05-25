export const DomainOrderHelper = {
    STATES: {
        AWAITING_PAYMENT: 11,
        PAYMENT_ACCEPTED: 2,
        PREPARATION: 3,
        SHIPPED: 4,
        DELIVERED: 5,
        CANCELLED: 6
    },

    /** Indique si un état de commande nécessite de déclencher une mise à jour ou un mouvement de stock */
    triggersStockMovement(stateId: number | string): boolean {
        const id = Number(stateId);
        return id === this.STATES.DELIVERED || id === this.STATES.CANCELLED;
    },

    /** Indique si l'état désigne une commande en cours de traitement (pending) */
    isPending(stateId: number | string): boolean {
        const id = Number(stateId);
        return id === this.STATES.PAYMENT_ACCEPTED || 
               id === this.STATES.PREPARATION || 
               id === this.STATES.AWAITING_PAYMENT;
    }
};
