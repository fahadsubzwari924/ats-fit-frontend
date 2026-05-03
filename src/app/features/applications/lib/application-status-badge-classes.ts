/** Human-readable label for API status values (snake_case). */
export function formatApplicationStatusLabel(status: string | undefined): string {
  if (!status) {
    return '—';
  }
  return status.replace(/_/g, ' ');
}

/** Tailwind badge classes aligned with `JobHistoryCardComponent.getStatusColor`. */
export function applicationStatusBadgeClasses(status: string | undefined | null): string {
  switch (status) {
    case 'wishlist':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    case 'interested':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'applied':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'screening':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'technical_round':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'interviewed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'offer_received':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'offer_declined':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
