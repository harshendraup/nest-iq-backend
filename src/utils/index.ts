export const entityIdGenerator = (entityType: string): string => {
  if (!entityType || typeof entityType !== "string") {
    throw new Error("Invalid entityType provided for entity ID generation.");
  }

  const prefix = entityType.slice(0, 2).toUpperCase(); // First 2 letters
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // Random 4 digits
  const timeSuffix = Date.now().toString().slice(-4); // Last 4 digits of timestamp

  return `${prefix}${randomDigits}${timeSuffix}`;
};
