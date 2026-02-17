import OnboardClient from "./OnboardClient";

export default function Home() {
  const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID ?? "";

  return <OnboardClient fbAppId={fbAppId} />;
}
