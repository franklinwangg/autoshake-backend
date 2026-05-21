from fastapi import FastAPI

from controllers.tailored_resume_controller import router

app = FastAPI(title="AutoShake API", version="1.0.0")
app.include_router(router)
