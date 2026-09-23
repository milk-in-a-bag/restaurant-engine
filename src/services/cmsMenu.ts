export interface ResolvedOrderItem {
  cms_item_id: string;
  name: string;
  price: number;
  qty: number;
}

interface CmsMenuItem {
  name: string;
  price: number;
  restaurant_id: string;
}

type ResolveResult =
  | { success: true; items: ResolvedOrderItem[] }
  | { success: false; error: string };

const CMS_BASE_URL = process.env.CMS_BASE_URL;

async function fetchMenuItemsByIds(
  documentIds: string[],
): Promise<Map<string, CmsMenuItem>> {
  if (!CMS_BASE_URL) {
    throw new Error("Missing CMS_BASE_URL environment variable");
  }

  const uniqueIds = [...new Set(documentIds)];
  const params = new URLSearchParams();
  uniqueIds.forEach((id, index) => {
    params.append(`filters[documentId][$in][${index}]`, id);
  });

  const response = await fetch(
    `${CMS_BASE_URL}/menu-items?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`CMS request failed with status ${response.status}`);
  }

  const body = await response.json();
  const map = new Map<string, CmsMenuItem>();

  for (const item of body.data) {
    map.set(item.documentId, {
      name: item.name,
      price: item.price,
      restaurant_id: item.restaurant_id,
    });
  }

  return map;
}

/**
 * Looks up real name/price for each ordered item from the CMS, and confirms
 * every item actually belongs to the restaurant the order is for. Never
 * trusts anything from the client except which item and how many.
 */
export async function resolveOrderItems(
  items: { cms_item_id: string; qty: number }[],
  restaurantId: string,
): Promise<ResolveResult> {
  const menuItems = await fetchMenuItemsByIds(items.map((i) => i.cms_item_id));

  const resolved: ResolvedOrderItem[] = [];

  for (const item of items) {
    const menuItem = menuItems.get(item.cms_item_id);

    if (!menuItem) {
      return {
        success: false,
        error: `Menu item ${item.cms_item_id} not found`,
      };
    }

    if (menuItem.restaurant_id !== restaurantId) {
      return {
        success: false,
        error: `Menu item ${item.cms_item_id} does not belong to this restaurant`,
      };
    }

    resolved.push({
      cms_item_id: item.cms_item_id,
      name: menuItem.name,
      price: menuItem.price,
      qty: item.qty,
    });
  }

  return { success: true, items: resolved };
}
