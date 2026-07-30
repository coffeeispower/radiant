import type { Metadata } from "next"
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl"
import { getMessages } from "next-intl/server"
import "./globals.css"
import { RadiantAtomsProvider } from "@/context/RadiantAtomsProvider"
import { groteskFont } from "@/lib/fonts"
import { isLocale } from "@/lib/i18n"
import StyledComponentsRegistry from "@/lib/styledComponentsRegistry"
import { ReactScan } from "@/lib/ReactScan"

export const metadata: Metadata = {
	title: "Radiant",
	description: "Faz o teu som",
	icons: "/favicon.svg",
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const messages = await getMessages()

	return (
		<html className={`${groteskFont.variable} h-full antialiased`}>
			<body className="min-h-full flex flex-col">
				<ReactScan />
				<StyledComponentsRegistry>
					<NextIntlClientProvider messages={messages}>
						<RadiantAtomsProvider>
							{children}
						</RadiantAtomsProvider>
					</NextIntlClientProvider>
				</StyledComponentsRegistry>
			</body>
		</html>
	)
}
