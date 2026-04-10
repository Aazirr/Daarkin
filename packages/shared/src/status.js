export const APPLICATION_STATUSES = ["applied", "interview", "offer", "rejected"];

export function isValidApplicationStatus(value) {
  return APPLICATION_STATUSES.includes(value);
}
