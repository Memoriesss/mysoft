import { defineConfig, type Connect, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// 转发 LLM API 请求到上游，避开浏览器 CORS
// 前端请求 /llm/*  →  https://api.minimaxi.com/anthropic/*
const LLM_UPSTREAM = "https://api.minimaxi.com/anthropic";

function llmProxy(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/llm/")) return next();
    if (req.method !== "POST") return next();

    const target = LLM_UPSTREAM + req.url.slice(4); // 去掉 /llm 前缀
    // 读 body
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks);

    try {
      const headers: Record<string, string> = {
        "Content-Type": req.headers["content-type"] ?? "application/json",
        "anthropic-version":
          (req.headers["anthropic-version"] as string) ?? "2023-06-01",
      };
      const apiKey = req.headers["x-api-key"];
      if (apiKey) headers["x-api-key"] = String(apiKey);

      const upstream = await fetch(target, {
        method: "POST",
        headers,
        body,
        // @ts-expect-error Node 18+ duplex
        duplex: "half",
      } as RequestInit);

      res.statusCode = upstream.status;
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") ?? "application/json",
      );
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch (e) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(`Proxy error: ${(e as Error).message}`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    // Vite 内置 http-proxy 在沙箱里连不上 minimaxi，所以用手写的 fetch 中间件
    proxy: undefined,
  },
  plugins: [
    {
      // 注册自定义 LLM 代理
      name: "llm-fetch-proxy",
      configureServer(server: ViteDevServer) {
        server.middlewares.use(llmProxy());
      },
    },
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }),
    tsconfigPaths()
  ],
})
