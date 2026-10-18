import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = { title: { absolute: "Shoe Forge: design your sneaker in 3D" } };

export default function HomePage() {
  return <Landing />;
}
