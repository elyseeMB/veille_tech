import { ClusterArticles } from "@/components/ClusterArticles";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useParams } from "react-router";

export default function ClusterSection() {
	const { id } = useParams();
	const isMobile = useMediaQuery("(max-width: 768px)");
	return <ClusterArticles id={id!} variant={isMobile ? "mobile" : "desktop"} />;
}
