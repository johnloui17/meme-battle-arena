interface RouterInstance {
  push: (href: string) => void;
  replace: (href: string) => void;
}

let routerInstance: RouterInstance | null = null;

export function setRouter(router: RouterInstance) {
  routerInstance = router;
}

export function navigate(path: string) {
  if (typeof window === "undefined") return;
  if (routerInstance) routerInstance.push(path);
  else window.location.href = path;
}
