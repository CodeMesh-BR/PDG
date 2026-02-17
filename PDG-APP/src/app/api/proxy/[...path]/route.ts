import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

type ProxyContext = {
  params: {
    path?: string[];
  };
};

function getApiBaseUrl(): string | null {
  const base = process.env.API_BASE_URL?.trim();
  if (!base) return null;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function copyHeaders(headers: Headers): Headers {
  const result = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      result.set(key, value);
    }
  });
  return result;
}

async function handleProxy(request: NextRequest, context: ProxyContext): Promise<NextResponse> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { message: "Server misconfigured: API_BASE_URL is missing." },
      { status: 500 }
    );
  }

  const path = (context.params.path ?? []).join("/");
  const targetUrl = `${baseUrl}/${path}${request.nextUrl.search}`;

  const headers = copyHeaders(request.headers);
  const method = request.method.toUpperCase();

  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  try {
    const upstream = await fetch(targetUrl, init);
    const responseHeaders = copyHeaders(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach upstream API." },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function HEAD(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}
