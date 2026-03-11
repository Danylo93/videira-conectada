import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { SITE_URL, getPageMetadata } from "@/config/route-metadata";

function upsertMeta(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const pageInfo = getPageMetadata(pathname);

    document.title = pageInfo.title;

    upsertMeta('meta[name="description"]', "name", "description", pageInfo.description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", pageInfo.title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", pageInfo.description);
    upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
    upsertMeta('meta[property="og:image"]', "property", "og:image", pageInfo.image);
    upsertMeta('meta[property="og:image:secure_url"]', "property", "og:image:secure_url", pageInfo.image);
    upsertMeta('meta[property="og:image:type"]', "property", "og:image:type", pageInfo.imageType);
    upsertMeta('meta[property="og:url"]', "property", "og:url", `${SITE_URL}${pathname}`);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", pageInfo.twitterCard);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", pageInfo.title);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", pageInfo.description);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", pageInfo.image);
  }, [location.pathname]);
}
