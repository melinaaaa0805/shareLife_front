declare module "@lottiefiles/dotlottie-react" {
  import * as React from "react";

  export interface DotLottieReactProps {
    src: string | object;
    autoplay?: boolean;
    loop?: boolean;
    style?: React.CSSProperties;
  }

  export const DotLottieReact: React.FC<DotLottieReactProps>;
}
