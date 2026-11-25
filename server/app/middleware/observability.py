import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("buildnest.access")


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Observability & metrics middleware:
    Logs every inbound HTTP request with response status code and execution duration (in ms).
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(f"{method} {path} -> {response.status_code} ({duration_ms}ms)")
            return response
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"{method} {path} -> 500 Unhandled Exception ({duration_ms}ms): {exc}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An unexpected error occurred. Please try again later."
                }
            )
