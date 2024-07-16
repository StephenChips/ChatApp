import { Context } from "koa";

export function requestBodyContentType(...mimeTypes: [string, ...string[]]) {
  return function middleware(ctx: Context, next: () => void) {
    if (!mimeTypes.includes(ctx.request.type)) {
      ctx.throw(
        400,
        mimeTypes.length === 1
          ? `Requires a ${mimeTypes[0]} body`
          : `Requires a ${mimeTypes.slice(0, -1).join(", ")} or ${mimeTypes[mimeTypes.length - 1]} body`
      );
    } else {
      next();
    }
  }
}
