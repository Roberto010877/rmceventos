/**
 * Redimensiona y comprime fotos en el navegador para que ocupen poco espacio (<200KB)
 * y carguen al instante en Firestore sin exceder límites de tamaño.
 */
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      const fallbackReader = new FileReader();
      fallbackReader.onloadend = () => resolve(fallbackReader.result as string);
      fallbackReader.readAsDataURL(file);
    };
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    reader.readAsDataURL(file);
  });
};
