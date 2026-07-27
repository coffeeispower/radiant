import { useTranslations } from "next-intl"

import { displayFont, groteskFont } from "@/lib/fonts"
import { Button } from "@/components/Button"

export function HeroCopy(props: { ctaHref?: string }) {
	const t = useTranslations()

	return (
		<div>
			<h2
				className={`${displayFont.className} max-w-[8ch] text-[4.2rem] leading-[0.88] text-neo-black sm:text-[5.6rem] lg:text-[7.4rem]`}
			>
				{t("OWN THE AIR")}
			</h2>

			<p
				className={`${groteskFont.className} mt-6 max-w-[34rem] text-lg leading-8 text-black/75 sm:text-xl`}
			>
				{t("Stop waiting for the right station to appear")}
				<br />
				{t("Start your own")}
			</p>

			<div className="mt-8 flex flex-wrap gap-4">
				<Button asChild>
					<a href={props.ctaHref ?? "/login"} draggable={false}>
						{t("Get started")}
					</a>
				</Button>
			</div>
		</div>
	)
}
