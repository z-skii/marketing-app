/* eslint-disable @next/next/no-img-element */
/**
 * A plain image for real uploaded media. Frame Shift shows media as it is,
 * at its source ratio, from the product's own upload storage; the Next
 * image optimizer is not used for these files.
 */
export function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} alt={props.alt ?? ""} />;
}
