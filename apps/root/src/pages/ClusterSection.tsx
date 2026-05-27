import { useParams } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ClusterArticles } from "@/components/ClusterArticles";

export default function ClusterSection() {
  const { id } = useParams();
  const isMobile = useMediaQuery("(max-width: 768px)");
  return <ClusterArticles id={id!} variant={isMobile ? "mobile" : "desktop"} />;
}
