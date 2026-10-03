import { environment } from 'src/environments/environment';

export function base64ToBlob(base64: string, contentType = ''): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}


export function resolveFileUrl(
  value: string
): { url: string; type: 'PDF' } | null {

  if (!value) return null;

  if (value.startsWith('http')) {
    return {
      url: value,
      type: 'PDF'
    };
  }

  if (value.startsWith('files/')) {
    const url = `${environment.apiUrl}/${value}`;
    return {
      url,
      type: 'PDF'
    };
  }

  let base64 = value;

  if (base64.startsWith('data:')) {
    const parts = base64.split(',');
    if (parts.length > 1) base64 = parts[1];
  }

  const blob = base64ToBlob(base64, 'application/pdf');
  const url = URL.createObjectURL(blob);

  return {
    url,
    type: 'PDF'
  };
}