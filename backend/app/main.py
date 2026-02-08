from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health_router, items_router, emails_router

app = FastAPI(title="Backend Exercise API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(items_router)
app.include_router(emails_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
