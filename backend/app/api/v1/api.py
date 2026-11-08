from fastapi import APIRouter
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.incidents import router as incidents_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.scenarios import router as scenarios_router

api_router = APIRouter()
api_router.include_router(reports_router, tags=["Reports"])
api_router.include_router(incidents_router, tags=["Incidents"])
api_router.include_router(dashboard_router, tags=["Dashboard & Analytics"])
api_router.include_router(scenarios_router, tags=["Scenarios & Export"])
