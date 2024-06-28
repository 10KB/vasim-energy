export const extractNumber = (string_: string) => {
  return Number.parseFloat(string_.replace(/[^\d.-]/, '').replace(',', '.'));
};
