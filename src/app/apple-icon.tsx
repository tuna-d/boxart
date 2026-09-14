import { ImageResponse } from "next/og";
import { PixelB } from "./_brand/images";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PixelB size={180} />, size);
}
