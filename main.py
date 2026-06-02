import logging
import time

logging.basicConfig(level=logging.DEBUG)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from controllers.auth_controller import router as auth_router
from controllers.resume_controller import router as resume_router
from controllers.tailored_resume_controller import router as tailored_resume_router

app = FastAPI(title="AutoShake API", version="1.0.0")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    print(f"--> {request.method} {request.url.path} | headers: {dict(request.headers)}")
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    print(f"<-- {request.method} {request.url.path} | status: {response.status_code} | {duration:.1f}ms")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(tailored_resume_router)
