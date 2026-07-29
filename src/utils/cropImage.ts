/**
 * cropImage.ts
 * Recebe a imagem original + área de crop do react-easy-crop,
 * redimensiona para no máximo 256×256px e retorna uma string Base64 (JPEG, qualidade 0.8).
 */

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cria um HTMLImageElement a partir de uma URL/Base64 e aguarda o carregamento.
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Extrai a área recortada da imagem e retorna como Base64.
 * O canvas de saída é limitado a MAX_SIZE × MAX_SIZE (256×256).
 */
const MAX_SIZE = 256;

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop
): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = MAX_SIZE;
  canvas.height = MAX_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível obter o contexto 2D do canvas.');
  }

  // Desenha a região recortada da imagem original no canvas 256×256
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    MAX_SIZE,
    MAX_SIZE
  );

  // Retorna como PNG para preservar transparência (canal alpha)
  return canvas.toDataURL('image/png');
}
