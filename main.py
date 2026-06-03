from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from controllers.auth_controller import router as auth_router
from controllers.resume_controller import router as resume_router
from controllers.tailored_resume_controller import router as tailored_resume_router

app = FastAPI(title="AutoShake API", version="1.0.0")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print("VALIDATION ERROR on", request.method, request.url.path)
    print("RAW BODY:", body.decode("utf-8", errors="replace"))
    print("ERRORS:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

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
