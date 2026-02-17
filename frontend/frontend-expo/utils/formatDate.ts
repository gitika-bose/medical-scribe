/**
 * Simple date formatter to avoid pulling in date-fns.
 * Produces strings like "Jan 5, 2025 at 3:45 PM".
 */
export function formatAppointmentDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

/**
 * Produces a longer format like "January 5, 2025 at 3:45 PM".
 */
export function formatAppointmentDateLong(isoString: string): string {
  try {
    const date = new Date(isoString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}
