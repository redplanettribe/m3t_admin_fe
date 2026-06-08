export function dmConversationId(
  eventId: string,
  userIdA: string,
  userIdB: string
): string {
  const [min, max] = [userIdA.toLowerCase(), userIdB.toLowerCase()].sort()
  return `dm:${eventId.toLowerCase()}:${min}:${max}`
}
