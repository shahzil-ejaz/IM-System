from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Log"]
)


# ─── SHARED HELPER ────────────────────────────────────────────────────────────
def record_audit(
    db: Session,
    action: str,
    *,
    actor: models.User | None = None,
    resource: str | None = None,
    resource_id: str | int | None = None,
    detail: str | None = None,
    status: str = "success",
    ip_address: str | None = None,
):
    """
    Write a single audit log record inside the caller's transaction.
    Uses flush() so it participates in the parent commit.
    Non-fatal: audit errors are printed but never crash the main operation.
    """
    try:
        log = models.AuditLog(
            actor_id=actor.id if actor else None,
            actor_username=actor.username if actor else None,
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id is not None else None,
            detail=detail,
            status=status,
            ip_address=ip_address,
        )
        db.add(log)
        db.flush()
    except Exception as exc:  # pragma: no cover
        print(f"[AUDIT WARNING] Could not write audit log: {exc}")


# ─── ENDPOINT ─────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    """Return the most recent audit log entries, newest first. Admin only."""
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs
