import { useRouteError } from "react-router";
import { PageError } from "./PageError.tsx";

export function ErrorBoundary({ error: propsError }: { error?: string }) {
	const error = useRouteError() ?? propsError;
	return <PageError error={error?.toString()} />;
}
