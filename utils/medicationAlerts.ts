// Medication alert utility functions

export interface MedicationAlert {
    id: string;
    medicationId: string;
    medicationName: string;
    type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
    severity: 'high' | 'medium' | 'low';
    message: string;
    quantity?: number;
    minQuantity?: number;
    expirationDate?: string;
}

/**
 * Check if a medication is low on stock
 */
export function isLowStock(quantity: number, minQuantity: number = 10): boolean {
    return quantity < minQuantity;
}

/**
 * Check if a medication is expiring soon (within 30 days)
 */
export function isExpiringSoon(expirationDate: string): boolean {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
}

/**
 * Check if a medication is expired
 */
export function isExpired(expirationDate: string): boolean {
    const expDate = new Date(expirationDate);
    const now = new Date();
    return expDate < now;
}

/**
 * Get expiration status color
 */
export function getExpirationColor(expirationDate: string | undefined): string {
    if (!expirationDate) return 'text-slate-400';
    if (isExpired(expirationDate)) return 'text-red-500';
    if (isExpiringSoon(expirationDate)) return 'text-orange-500';
    return 'text-emerald-400';
}

/**
 * Get expiration status icon
 */
export function getExpirationIcon(expirationDate: string | undefined): '🔴' | '🟠' | '🟢' | '⚪' {
    if (!expirationDate) return '⚪';
    if (isExpired(expirationDate)) return '🔴';
    if (isExpiringSoon(expirationDate)) return '🟠';
    return '🟢';
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(expirationDate: string | undefined): string {
    if (!expirationDate) return 'N/A';
    const date = new Date(expirationDate);
    return date.toLocaleDateString('lt-LT');
}

/**
 * Get days until expiration
 */
export function getDaysUntilExpiration(expirationDate: string): number {
    const expDate = new Date(expirationDate);
    const now = new Date();
    return Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate alerts for medications
 */
export function generateMedicationAlerts(medications: Array<{
    id: string;
    name: string;
    quantity: number;
    minQuantity?: number;
    expirationDate?: string;
}>): MedicationAlert[] {
    const alerts: MedicationAlert[] = [];

    medications.forEach(med => {
        // Check for low stock
        if (isLowStock(med.quantity, med.minQuantity)) {
            alerts.push({
                id: `alert-${med.id}-stock`,
                medicationId: med.id,
                medicationName: med.name,
                type: 'LOW_STOCK',
                severity: med.quantity === 0 ? 'high' : 'medium',
                message: `Mažas kiekis: ${med.quantity} vnt. (min: ${med.minQuantity || 10})`,
                quantity: med.quantity,
                minQuantity: med.minQuantity
            });
        }

        // Check for expiration
        if (med.expirationDate) {
            if (isExpired(med.expirationDate)) {
                alerts.push({
                    id: `alert-${med.id}-expired`,
                    medicationId: med.id,
                    medicationName: med.name,
                    type: 'EXPIRED',
                    severity: 'high',
                    message: `Pasibaigęs galiojimas: ${formatExpirationDate(med.expirationDate)}`,
                    expirationDate: med.expirationDate
                });
            } else if (isExpiringSoon(med.expirationDate)) {
                const days = getDaysUntilExpiration(med.expirationDate);
                alerts.push({
                    id: `alert-${med.id}-expiring`,
                    medicationId: med.id,
                    medicationName: med.name,
                    type: 'EXPIRING_SOON',
                    severity: days <= 7 ? 'high' : 'medium',
                    message: `Baigiasi galiojimas po ${days} d.: ${formatExpirationDate(med.expirationDate)}`,
                    expirationDate: med.expirationDate
                });
            }
        }
    });

    // Sort by severity
    return alerts.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
}
