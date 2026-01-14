import LottieView, { LottieViewProps } from "lottie-react-native";

interface LottieAnimationProps extends LottieViewProps {}

export default function LottieAnimation(props: LottieAnimationProps) {
  return <LottieView {...props} />;
}
