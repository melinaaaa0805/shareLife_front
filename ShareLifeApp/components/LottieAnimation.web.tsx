import * as React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieAnimationProps {
  source: string | object;
  style?: React.CSSProperties;
}

export default function LottieAnimation({
  source,
  style,
}: LottieAnimationProps) {
  return <DotLottieReact src={source} autoplay loop style={style} />;
}
