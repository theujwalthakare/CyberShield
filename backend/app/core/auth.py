"""Clerk JWT verification and user sync dependency for FastAPI."""

from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    """Fetch and cache Clerk JWKS public keys."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not settings.CLERK_JWKS_URL:
        return {}

    resp = httpx.get(settings.CLERK_JWKS_URL, timeout=10)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    return _jwks_cache # type: ignore


def _decode_clerk_token(token: str) -> dict:
    """Decode and verify a Clerk JWT using JWKS."""
    jwks = _get_jwks()

    if not jwks or not jwks.get("keys"):
        # Fallback: local JWT verification for dev/demo
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

    # Get the key id from the token header
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == kid:
            rsa_key = key
            break

    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find matching key",
        )

    return jwt.decode(
        token,
        rsa_key,
        algorithms=["RS256"],
        issuer=settings.CLERK_ISSUER or None,
    )


def _sync_user(db: Session, claims: dict) -> User:
    """Get or create a local user from Clerk JWT claims."""
    clerk_id = claims.get("sub", "")
    email = claims.get("email", claims.get("email_address", ""))

    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if user:
        return user

    # Auto-create on first login
    user = User(
        clerk_id=clerk_id,
        email=email or f"{clerk_id}@clerk.user",
        full_name=claims.get("name", claims.get("first_name", "")),
        role="citizen",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: verify JWT, sync user, return User model."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        claims = _decode_clerk_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    return _sync_user(db, claims)


def require_role(*roles: str):
    """Factory returning a dependency that checks user role."""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not authorized. Required: {roles}",
            )
        return user

    return checker
