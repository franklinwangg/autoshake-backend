from fastapi import FastAPI

from controllers.auth_controller import router as auth_router
from controllers.resume_controller import router as resume_router
from controllers.tailored_resume_controller import router as tailored_resume_router

app = FastAPI(title="AutoShake API", version="1.0.0")
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(tailored_resume_router)
