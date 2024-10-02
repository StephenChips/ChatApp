import { Jimp, ResizeStrategy } from "jimp";

/**
 * Create an avatar from a image file uploaded from users.
 *
 * The image will be center cropped to a square whose edge's length is
 * `MIN(width, height)` of the image. If *EITHER* its width or height is
 * greater than `maxAvatarSize`, the image will be shrinked proportionally
 * so that the shortest edge's length equals to `maxAvatarSize`.
 *
 * The effect is similar to setting the CSS property `object-fit: cover` on an
 * `<img>` and set both the width and height to `MIN(maxAvatarSize, width, height)`.
 *
 * Say if I want an avatar with max avatar size of 400 pixels.
 *
 * Example 1: For an image that is 300×200px, it will be center-cropped to
 * 200*200 pixels.
 *
 * Example 2: For an image that is 800×1200px, the image will be resized
 * to 400×600 first, and will be center cropped to 400×400 pixels.
 *
 * @param file
 * @param maxAvatarSize
 * @returns
 */
export function createAvatarFromBlob(
  file: Blob,
  maxAvatarSize: number,
): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const mode = ResizeStrategy.BILINEAR;

      const image = await Jimp.fromBuffer(buffer);

      if (image.width > maxAvatarSize || image.height > maxAvatarSize) {
        if (image.width >= image.height) {
          image.resize({
            w: image.width * (maxAvatarSize / image.height),
            h: maxAvatarSize,
            mode,
          });
        } else {
          image.resize({
            w: maxAvatarSize,
            h: image.height * (maxAvatarSize / image.width),
            mode,
          });
        }
      }

      if (image.width !== image.height) {
        const cropSize = Math.min(image.width, image.height);
        image.crop({
          w: cropSize,
          h: cropSize,
          x: cropSize === image.width ? 0 : (image.width - cropSize) / 2,
          y: cropSize === image.height ? 0 : (image.height - cropSize) / 2,
        });
      }

      const res = await image.getBuffer("image/jpeg");
      resolve(new Blob([res]));
    };

    reader.readAsArrayBuffer(file);
  });
}
