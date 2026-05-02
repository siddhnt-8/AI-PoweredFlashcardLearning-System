"""
routers/auth.py — Authentication endpoints.

Endpoints:
  POST /auth/signup — Register a new user
  POST /auth/login  — Authenticate and return JWT token
  GET  /auth/me     — Return current logged-in user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    LoginRequest,
    LoginResponse,
    SignupRequest,
    SignupResponse,
    UserOut,
)
from services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_user_by_email,
    hash_password,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /auth/signup
# ---------------------------------------------------------------------------
@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Email must be unique
    - Password is hashed with bcrypt before storing
    - Returns a JWT token so the user is logged in immediately

    Example request:
    ```json
    { "email": "user@example.com", "password": "mypassword123" }
    ```

    Example response:
    ```json
    {
      "access_token": "eyJ...",
      "token_type": "bearer",
      "user": { "id": 1, "email": "user@example.com" }
    }
    ```
    """
    # Check if email already exists
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user
    user = User(
        email=payload.email.lower().strip(),
        password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue JWT immediately so user is logged in after signup
    token = create_access_token(data={"sub": user.email})

    return SignupResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(id=user.id, email=user.email),
        message="Account created successfully! Welcome to FlashAI 🎉",
    )


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login and get JWT token",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.

    Example request:
    ```json
    { "email": "user@example.com", "password": "mypassword123" }
    ```

    Example response:
    ```json
    {
      "access_token": "eyJ...",
      "token_type": "bearer",
      "user": { "id": 1, "email": "user@example.com" }
    }
    ```
    """
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.email})

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(id=user.id, email=user.email),
        message=f"Welcome back, {user.email}! 👋",
    )


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current logged-in user",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the currently authenticated user's info.
    Requires a valid Bearer token in the Authorization header.

    Example response:
    ```json
    { "id": 1, "email": "user@example.com" }
    ```
    """
    return UserOut(id=current_user.id, email=current_user.email)