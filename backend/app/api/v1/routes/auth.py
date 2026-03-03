from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt

from app.core.config import settings
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    if payload.password != "admin123":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": payload.email, "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return TokenResponse(access_token=token)
