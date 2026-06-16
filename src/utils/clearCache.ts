// 清除所有本地缓存：localStorage + IndexedDB
// 用于首页"清除缓存"按钮和调试

import { db } from "../db/memory";

/** 清掉 zustand persist 的 localStorage key（kidbot:*） */
export function clearLocalStorage() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("kidbot")) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}

/** 清掉 IndexedDB 里所有 kidbot 表（profile / facts / conversations） */
export async function clearIndexedDb() {
  // 整库删除最干净（profile/facts/conversations 三张表一次清完）
  await db.delete();
  // 删完后重新打开，后续代码可以继续用
  await db.open();
}

/** 一键清空所有缓存，并刷新页面让状态重置 */
export async function clearAllAndReload(): Promise<void> {
  clearLocalStorage();
  await clearIndexedDb();
  // 强制从服务器重新拉资源，避免缓存的旧 JS
  window.location.reload();
}
