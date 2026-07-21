from fastapi import FastAPI

from saas_compute.api.health import router as health_router
from saas_compute.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    service_settings = settings or get_settings()
    application = FastAPI(
        title=service_settings.service_name,
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    application.include_router(health_router)
    return application


app = create_app()
