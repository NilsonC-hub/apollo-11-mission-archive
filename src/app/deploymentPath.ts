function normalizedBasePath(baseUrl: string): string {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '')
  return withoutTrailingSlash || '/'
}

const configuredBaseUrl = import.meta.env?.BASE_URL ?? '/'

export const APP_BASENAME = normalizedBasePath(configuredBaseUrl)

export function deploymentPath(appPath: string, basePath = APP_BASENAME): string {
  if (!appPath.startsWith('/')) throw new TypeError('Application paths must start with /')
  const normalizedBase = normalizedBasePath(basePath)
  if (normalizedBase === '/') return appPath
  return appPath === '/' ? `${normalizedBase}/` : `${normalizedBase}${appPath}`
}

export function applicationPathname(pathname: string, basePath = APP_BASENAME): string {
  const normalizedBase = normalizedBasePath(basePath)
  if (normalizedBase === '/') return pathname
  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) return '/'
  return pathname.startsWith(`${normalizedBase}/`)
    ? pathname.slice(normalizedBase.length)
    : pathname
}

export function publicAssetUrl(publicPath: string): string {
  return deploymentPath(publicPath)
}
