export const isNavItemActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);
