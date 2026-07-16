from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from ..database import get_db
from .. import models, schemas
from ..auth import require_role

router = APIRouter(
    prefix="/settings",
    tags=["settings"]
)

# Initialize default settings if not exists
def init_settings(db: Session):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "pos_settings").first()
    if not setting:
        default_settings = {
            "enableScanner": True,
            "enableHoldCart": True,
            "enableReprint": True
        }
        new_setting = models.SystemSettings(
            key="pos_settings",
            value=json.dumps(default_settings)
        )
        db.add(new_setting)
        db.commit()
        db.refresh(new_setting)
        return default_settings
    return json.loads(setting.value)

@router.get("/pos")
def get_pos_settings(db: Session = Depends(get_db)):
    return init_settings(db)

@router.put("/pos")
def update_pos_settings(
    settings: dict,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_role(["admin"]))
):
    setting = db.query(models.SystemSettings).filter(models.SystemSettings.key == "pos_settings").first()
    
    if not setting:
        setting = models.SystemSettings(key="pos_settings", value="{}")
        db.add(setting)

    # Update value
    current_val = json.loads(setting.value) if setting.value else {}
    current_val.update(settings)
    setting.value = json.dumps(current_val)
    
    db.commit()
    db.refresh(setting)
    
    return json.loads(setting.value)
