import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
	reactCompiler: true,
	transpilePackages: ["@radiant/backend", "@radiant/client"],
	compiler: {
		styledComponents: true
	}
}

const withNextIntl = createNextIntlPlugin({
	requestConfig: "./i18n/request.ts",
	experimental: {

	}
})

export default withNextIntl(nextConfig)
