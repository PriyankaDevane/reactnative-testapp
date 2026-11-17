import dayjs from "dayjs";

export const formatSubscriptionDateTime = (value?: string) => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid()
    ? parsedDate.format("MM/DD/YYYY")
    : "Not provided";
};

export const formatStatusLabel = (value?: string) => {
  if (!value) return "Unknown";
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
};
