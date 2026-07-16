from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.routers.audit_logs import record_audit
from app.database import get_db
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_role,
)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


# ==========================================
# LOGIN — matches tokenUrl="api/users/login"
# ==========================================
@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return a JWT access token.
    Uses OAuth2-compatible form fields (username + password).
    """
    ip = request.client.host if request.client else None
    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        # Log failed login attempt
        record_audit(
            db, "LOGIN_FAILED",
            resource="User", resource_id=form_data.username,
            detail=f"Failed login attempt for username '{form_data.username}'",
            status="failure", ip_address=ip,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        record_audit(
            db, "LOGIN_BLOCKED", actor=user,
            resource="User", resource_id=user.id,
            detail=f"Login blocked — account '{user.username}' is deactivated",
            status="failure", ip_address=ip,
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated",
        )

    record_audit(
        db, "LOGIN_SUCCESS", actor=user,
        resource="User", resource_id=user.id,
        detail=f"User '{user.username}' logged in successfully",
        ip_address=ip,
    )
    db.commit()
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# REGISTER — admin-only
# ==========================================
@router.post(
    "/",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    """Create a new user. Only admins can register new accounts."""
    existing_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    new_user = models.User(
        username=user.username,
        password_hash=get_password_hash(user.password),
        role=user.role,
        is_active=user.is_active,
    )
    db.add(new_user)
    db.flush()
    record_audit(
        db, "USER_CREATED", actor=current_user,
        resource="User", resource_id=new_user.id,
        detail=f"Admin '{current_user.username}' registered new user '{new_user.username}' with role '{new_user.role}'",
    )
    db.commit()
    db.refresh(new_user)
    return new_user


# ==========================================
# LIST ALL USERS — admin / manager
# ==========================================
@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


# ==========================================
# GET CURRENT USER PROFILE (self)
# ==========================================
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return current_user


# ==========================================
# GET USER BY ID — admin / manager
# ==========================================
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


# ==========================================
# UPDATE USER — admin-only
# ==========================================
@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent username conflicts with other users
    name_conflict = db.query(models.User).filter(
        models.User.username == user_update.username,
        models.User.id != user_id,
    ).first()
    if name_conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another user with this username already exists",
        )

    old_role = user.role
    user.username = user_update.username
    user.password_hash = get_password_hash(user_update.password)
    user.role = user_update.role
    user.is_active = user_update.is_active
    record_audit(
        db, "USER_UPDATED", actor=current_user,
        resource="User", resource_id=user.id,
        detail=f"Admin '{current_user.username}' updated user ID {user_id} (role: {old_role} → {user_update.role})",
    )
    db.commit()
    db.refresh(user)
    return user


# ==========================================
# DEACTIVATE / REACTIVATE USER — admin-only
# ==========================================
@router.patch("/{user_id}/status", response_model=schemas.UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    """Toggle a user's is_active flag (soft delete / reactivate)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    new_state = not user.is_active
    user.is_active = new_state
    action = "USER_ACTIVATED" if new_state else "USER_DEACTIVATED"
    record_audit(
        db, action, actor=current_user,
        resource="User", resource_id=user.id,
        detail=f"Admin '{current_user.username}' {'activated' if new_state else 'deactivated'} user '{user.username}'",
    )
    db.commit()
    db.refresh(user)
    return user


# ==========================================
# DELETE USER — admin-only
# ==========================================
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    """Hard delete a user from the system."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    try:
        db.delete(user)
        record_audit(
            db, "USER_DELETED", actor=current_user,
            resource="User", resource_id=user.id,
            detail=f"Admin '{current_user.username}' deleted user '{user.username}'",
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete user due to associated records. Consider suspending them instead.",
        )
    
    return None
