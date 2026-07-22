import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation, useRouteError } from "react-router";
import Logo from "./Logo.tsx";
import { Button } from "./ui/button.tsx";

const classNames = {
	wrapper: "grid place-items-center h-full text-center p-5",
	card: "flex flex-col gap-3 w-full p-10 lg:w-1/3 border border-border rounded-xl bg-secondary/50",
	title: "text-2xl flex gap-2 font-semibold items-center justify-center",
	description: "text-base text-txt-tertiary",
	detail:
		"text-sm text-txt-tertiary text-destructive font-mono text-start border border-border-low p-2 rounded-lg bg-level-1 mt-2",
};

type Props = {
	resetErrorBoundary?: () => void;
	error?: unknown;
};

export function PageError({ resetErrorBoundary, error: propsError }: Props) {
	const error = useRouteError() ?? propsError;
	const location = useLocation();
	const baseLocation = useRef(location);

	useEffect(() => {
		if (location.pathname !== baseLocation.current.pathname && resetErrorBoundary) {
			resetErrorBoundary();
		}
	}, [location, resetErrorBoundary]);

	if (!error) {
		return (
			<div className={classNames.wrapper}>
				<div className={classNames.card}>
					<div className="m-auto">
						<Logo />
					</div>
					<span className="text-4xl font-bold text-amber-200">404</span>
					<div className="flex items-center justify-center gap-2">
						<AlertTriangle className="stroke-primary-foreground fill-amber-200" size={24} />
						<h1 className={classNames.title}>Page not found</h1>
					</div>
					<p className={classNames.description}>The page you are looking for does not exist</p>
					<Button variant="default" render={<a href="/" />}>
						Back to home page
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={classNames.wrapper}>
			<div className={classNames.card}>
				<div className="m-auto">
					<Logo />
				</div>
				<h1 className={classNames.title}>Unexpected error</h1>
				{import.meta.env.DEV ? (
					<details>
						<summary className={classNames.description}>Something went wrong</summary>
						<p className={classNames.detail}>{error.toString()}</p>
					</details>
				) : (
					<>
						<Button variant="default" render={<a href="/" />}>
							Back to home page
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
