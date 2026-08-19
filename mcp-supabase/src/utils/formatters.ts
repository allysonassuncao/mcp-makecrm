export function stripTimezones(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      // Remove fuso horário de strings ISO (ex: 2026-08-18T00:00:00-03:00 -> 2026-08-18T00:00:00)
      const isoRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:\d{2})$/;
      if (isoRegex.test(val)) {
        result[key] = val.replace(isoRegex, "$1");
      } else {
        result[key] = val;
      }
    } else if (typeof val === 'object' && val !== null) {
      result[key] = stripTimezones(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
